const express = require("express");
const router = express.Router();
const multer = require("multer");
const { db, uploadVerificationFiles } = require("../config/firebase");
const { get, update, ref } = require("firebase/database");

const upload = multer({ storage: multer.memoryStorage() });

// ==============================
// Fetch user profile
// ==============================
router.get("/:uid", async (req, res) => {
  const { uid } = req.params;

  console.log("📌 [PROFILE] Request for UID:", uid);
  try {
    const userRef = ref(db, `users/${uid}`);
    console.log("📡 Fetching from RTDB path:", `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.log("❌ User not found in database");
      return res.json({ success: false, message: "User not found." });
    }

    console.log("✅ User found:", snapshot.val());
    return res.json({ success: true, user: snapshot.val() });
  } catch (error) {
    console.error("❌ [PROFILE ERROR]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================
// User submits verification documents
// POST /profile/verify/submit
// ==============================
router.post(
  "/verify/submit",
  upload.fields([
    { name: "idImage", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]),
  async (req, res) => {
    console.log("\n========== NEW VERIFICATION REQUEST ==========\n");

    try {
      const { uid, nin } = req.body;

      if (!uid || !nin) {
        return res.status(400).json({ success: false, message: "Missing UID or NIN" });
      }

      if (!req.files || !req.files.idImage || !req.files.selfie) {
        return res.status(400).json({ success: false, message: "Images missing" });
      }

      const idImageBuffer = req.files.idImage[0].buffer;
      const selfieBuffer = req.files.selfie[0].buffer;

      console.log("📸 ID Image Buffer Size:", idImageBuffer.length);
      console.log("🤳 Selfie Buffer Size:", selfieBuffer.length);

      // Upload to Cloudinary
      const { idUrl, selfieUrl } = await uploadVerificationFiles(uid, idImageBuffer, selfieBuffer);

      // Update user in RTDB
      const updatedUser = {
        nin,
        verificationStatus: "pending",
        idUrl,
        selfieUrl,
        submittedAt: new Date().toISOString(),
        verified: false
      };

      await update(ref(db, `users/${uid}`), updatedUser);

      console.log("✅ Verification submitted successfully:", updatedUser);
      return res.json({ success: true, message: "Verification submitted successfully.", user: { uid, ...updatedUser } });
    } catch (err) {
      console.error("❌ Verification Upload Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ==============================
// Approve or reject user verification (admin)
// POST /profile/user/:uid
// ==============================
router.post("/user/:uid", async (req, res) => {
  const { uid } = req.params;
  const { action } = req.body; // expected: "approved" or "rejected"

  let status;
  if (action === "approved") status = "active";
  else if (action === "rejected") status = "pending_verification";
  else return res.json({ success: false, message: "Invalid action" });

  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await update(userRef, { verificationStatus: action, verified: action === "approved" });

    return res.json({
      success: true,
      message: `User verification ${action}`,
      user: { ...snapshot.val(), verificationStatus: action, verified: action === "approved" }
    });
  } catch (err) {
    console.error("❌ Error verifying user:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
