// routes/bookings.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../config/firebase");
const { uploadToCloudinaryBuffer } = require("../helper/cloudinary");
const { calculateServiceCost } = require("../utils/pricing");

const upload = multer({ storage: multer.memoryStorage() });

/* --------------------------------------------------------
   AUTH MIDDLEWARE
--------------------------------------------------------- */
async function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  const xUser = req.headers["x-user-id"];

  if (!token || !xUser) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.userId = xUser;
  next();
}

/* --------------------------------------------------------
   CREATE BOOKING
--------------------------------------------------------- */
router.post(
  "/create",
  requireAuth,
  upload.fields([
    { name: "prescription", maxCount: 1 },
    { name: "verificationID", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const io = req.app.get("io") || null;
      const body = req.body || {};
      const now = new Date().toISOString();

      // -------------------------
      // Parse Inputs
      // -------------------------
      const {
        serviceKey,
        serviceName,
        testName,
        doctorRecommended,
        address,
        asap,
        scheduledAt,
        forSomeoneElse,
        distanceKm,
        userFullName,
        userPhone,
        userEmail,
        street,
        city,
        state,
        notes,
      } = body;

      const category = body.category || null;
      const requiresAddress = category !== "virtual_care";

      if (!serviceKey || !serviceName || (requiresAddress && !address)) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      // -------------------------
      // Clean Booleans
      // -------------------------
      const parsedAsap = asap ? JSON.parse(asap) : true;
      const parsedForSomeoneElse = forSomeoneElse
        ? JSON.parse(forSomeoneElse)
        : false;

      // -------------------------
      // Parse Arrays / JSON
      // -------------------------
      let subServices = [];
      try {
        subServices = body.subServices ? JSON.parse(body.subServices) : [];
        if (!Array.isArray(subServices)) subServices = [];
      } catch {
        subServices = [];
      }

      let recipient = null;
      try {
        recipient = body.recipient ? JSON.parse(body.recipient) : null;
      } catch {
        recipient = null;
      }

      // -------------------------
      // File Uploads
      // -------------------------
      let prescriptionUrl = null;
      if (req.files?.prescription?.[0]) {
        try {
          const buffer = req.files.prescription[0].buffer;
          const up = await uploadToCloudinaryBuffer(
            buffer,
            `bookings/prescription_${uuidv4()}`
          );
          prescriptionUrl = up?.secure_url || null;
        } catch (err) {
          console.error("Prescription upload failed:", err);
        }
      }

      let verificationIDUrl = null;
      if (req.files?.verificationID?.[0]) {
        try {
          const buffer = req.files.verificationID[0].buffer;
          const up = await uploadToCloudinaryBuffer(
            buffer,
            `bookings/verification_${uuidv4()}`
          );
          verificationIDUrl = up?.secure_url || null;
        } catch (err) {
          console.error("Verification ID upload failed:", err);
        }
      }

      // -------------------------
      // Price Calculation
      // -------------------------
      const finalEstimate = calculateServiceCost({
        serviceType: body.serviceType || "general",
        distanceKm: Number(distanceKm || 0),
        baseFee: Number(body.baseFee || 5000),
        perKmRate: 150,
        freeKm: 5,
        isASAP: parsedAsap,
        timeOfDay: new Date(scheduledAt || now).getHours(),
        trafficFactor: 1.25,
      });

      // -------------------------
      // Build Booking Object (Safe Structure)
      // -------------------------
      const bookingId = `bk_${uuidv4()}`;

      const booking = {
        id: bookingId,
        userId: req.userId,
        user: {
          fullName: userFullName || "Unknown",
          phone: userPhone || "Unknown",
          email: userEmail || "Unknown",
        },
        serviceKey,
        serviceName,
        testName: testName || null,
        doctorRecommended: doctorRecommended || null,
        subServices,
        address: requiresAddress
          ? { street: street || "", city: city || "", state: state || "" }
          : null,
        addressString: requiresAddress ? address : null,
        asap: parsedAsap,
        scheduledAt: parsedAsap ? now : scheduledAt,
        forSomeoneElse: parsedForSomeoneElse,
        recipient,
        prescription: prescriptionUrl ? { url: prescriptionUrl } : null,
        verificationIDUrl: verificationIDUrl || null,
        estimate: finalEstimate,
        pricing: {
          serviceFee: finalEstimate,
          tax: 0,
          total: finalEstimate,
        },
        distanceKm: Number(distanceKm || 0),
        category,
        notes: notes || null,
        status: "pending",
        timeline: [{ status: "pending", ts: now }],
        createdAt: now,
      };

      // -------------------------
      // Sanitize for Firebase
      // -------------------------
      function sanitizeForFirebase(obj) {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
        );
      }

      await db.ref(`bookings/${bookingId}`).set(sanitizeForFirebase(booking));
      await db.ref(`queues/pending/${bookingId}`).set({ bookingId, createdAt: now });

      // -------------------------
      // Socket: New Booking
      // -------------------------
      if (io) {
        io.to("admin").emit("booking:new", booking);
        io.emit("booking:pending", booking);
        console.log("SOCKET → booking:new", bookingId);
      }

      // -------------------------
      // Auto-assign Responder
      // -------------------------
      const respondersSnap = await db.ref("responders").once("value");
      const responders = respondersSnap.val() || {};

      const available = Object.entries(responders).find(
        ([, r]) => r?.status === "available"
      );

      if (available) {
        const [responderId, responder] = available;

        booking.status = "assigned";
        booking.assignedResponder = { id: responderId, name: responder.name || null };
        booking.timeline.push({ status: "assigned", ts: new Date().toISOString(), responderId });

        await db.ref(`bookings/${bookingId}`).update({
          status: "assigned",
          assignedResponder: booking.assignedResponder,
          timeline: booking.timeline,
        });

        await db.ref(`responders/${responderId}`).update({
          status: "busy",
          currentBooking: bookingId,
        });

        await db.ref(`queues/pending/${bookingId}`).remove();

        // -------------------------
        // Socket: Assigned Booking
        // -------------------------
        if (io) {
          io.to("admin").emit("booking:assigned", { bookingId, booking });
          io.to(`responder:${responderId}`).emit("booking:assigned", { bookingId, booking });
          io.to(`user:${booking.userId}`).emit("booking:updated", { bookingId, booking });
          console.log("SOCKET → booking assigned →", responderId);
        }
      }

      return res.json({ success: true, booking });
    } catch (err) {
      console.error("❌ bookings.create error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }
  }
);

// GET /bookings/user
router.get("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const snap = await db.ref("bookings").orderByChild("userId").equalTo(userId).once("value");
    const data = snap.val() || {};

    const bookings = Object.values(data); // convert from object to array
    return res.json({ success: true, bookings });
  } catch (err) {
    console.error("❌ bookings.get error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


module.exports = router;
