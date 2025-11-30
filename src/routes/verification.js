const express = require("express");
const router = express.Router();
const multer = require("multer");
const { db, uploadVerificationFiles } = require("../config/firebase");

const upload = multer({ storage: multer.memoryStorage() });

// POST /verify/submit
router.post(
  "/submit",
  upload.fields([
    { name: "idImage", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]),
  async (req, res) => {
    console.log("\n========== NEW VERIFICATION REQUEST ==========\n");

    try {
      // Log raw incoming request
      console.log("➡️ Incoming Body:", req.body);
      console.log("➡️ Incoming Files:", Object.keys(req.files || {}));

      const { uid, nin } = req.body;

      if (!uid || !nin) {
        console.log("❌ Missing UID or NIN");
        return res.status(400).json({
          success: false,
          message: "Missing required fields."
        });
      }

      console.log("📌 UID:", uid);
      console.log("📌 NIN:", nin);

      if (!req.files || !req.files.idImage || !req.files.selfie) {
        console.log("❌ Missing Image Uploads:", req.files);
        return res.status(400).json({
          success: false,
          message: "Images missing"
        });
      }

      // Extract buffers
      const idImageBuffer = req.files.idImage[0].buffer;
      const selfieBuffer = req.files.selfie[0].buffer;

      console.log("📸 ID Image Buffer Size:", idImageBuffer.length);
      console.log("🤳 Selfie Buffer Size:", selfieBuffer.length);

      // Upload to Cloudinary
      console.log("⬆️ Uploading to Cloudinary...");
      const { idUrl, selfieUrl } = await uploadVerificationFiles(
        uid,
        idImageBuffer,
        selfieBuffer
      );

      console.log("✅ Cloudinary Upload Complete");
      console.log("🌐 ID URL:", idUrl);
      console.log("🌐 Selfie URL:", selfieUrl);

      // Prepare DB update
      const updatedUser = {
        nin,
        verificationStatus: "pending",
        idUrl,
        selfieUrl,
        submittedAt: new Date().toISOString(),
        verified: false
      };

      console.log("📝 Updating Firebase Realtime DB...");

      await db.ref(`users/${uid}`).update(updatedUser);

      console.log("✅ Firebase Update Complete");
      console.log("🔄 Final Updated User:", updatedUser);

      return res.json({
        success: true,
        message: "Verification submitted successfully.",
        user: { uid, ...updatedUser }
      });
    } catch (err) {
      console.error("❌ Verification Upload Error:", err);

      return res.status(500).json({
        success: false,
        message: "Server error during verification upload"
      });
    }
  }
);

module.exports = router;
