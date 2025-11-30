const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// POST /admin/bookings/assign
// body: { bookingId, responderId }
router.post("/assign", async (req, res) => {
  try {
    const { bookingId, responderId } = req.body;
    if (!bookingId || !responderId) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const bookingRef = db.ref(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.once("value");

    if (!bookingSnap.exists()) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const now = new Date().toISOString();
    const newData = {
      status: "assigned",
      assignedResponder: { id: responderId, name: responderId },
      timeline: bookingSnap.val().timeline.concat([
        { status: "assigned", ts: now, responderId },
      ]),
    };

    // update booking
    await bookingRef.update(newData);

    // update responder
    await db
      .ref(`responders/${responderId}`)
      .update({ status: "busy", currentBooking: bookingId });

    // socket
    const io = req.app.locals.io;
    const booking = (await bookingRef.once("value")).val();

    io.to("admin:global").emit("admin:bookingAssigned", { bookingId, booking });
    io.to(`responder:${responderId}`).emit("responder:assigned", {
      bookingId,
      booking,
    });
    io.emit("booking:assigned", { bookingId, booking });

    return res.json({ success: true, booking });
  } catch (err) {
    console.error("assign error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve booking for payment
router.post("/approve", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Missing bookingId" });
    }
    // Update booking status to 'payment_pending'
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snapshot = await bookingRef.once("value");
    if (!snapshot.exists()) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const booking = snapshot.val();
    const io = req.app.locals.io;
    const updatedAt = Date.now();

    // Update booking status
    await bookingRef.update({
      status: "payment_pending",
      updatedAt,
    });

    const updatedBooking = {
      ...booking,
      status: "payment_pending",
      updatedAt,
    };

    // 🔥 PUSH TO ADMIN SOCKET
    io.to("admin:global").emit("booking:pending", {
      bookingId,
      booking: updatedBooking,
    });

    // 🔥 PUSH TO USER SOCKET (if connected)
    if (booking.userId) {
      io.to(`user_${booking.userId}`).emit("booking:pending", {
        bookingId,
        booking: updatedBooking,
      });
    }

    return res.json({ success: true, booking: updatedBooking });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

// POST /admin/bookings/reject
router.post("/reject", async (req, res) => {
  const { bookingId } = req.body;

  try {
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snap = await bookingRef.once("value");

    if (!snap.exists()) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const booking = snap.val();
    const now = Date.now();

    // Update booking status
    const updated = {
      ...booking,
      status: "rejected",
      updatedAt: now,
      timeline: (booking.timeline || []).concat([
        { status: "rejected", ts: now }
      ])
    };

    await bookingRef.update(updated);

    const io = req.app.locals.io;

    // Notify admin sockets
    io.to("admin").emit("booking:rejected", { bookingId, booking: updated });

    // Notify user sockets
    io.to(`user_${booking.userId}`).emit("booking:rejected", {
      bookingId,
      booking: updated,
    });

    return res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("reject error", err);
    res.json({ success: false, message: err.message });
  }
});


module.exports = router;
