const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { uploadToCloudinaryBuffer } = require("../helper/cloudinary");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Submit responder onboarding
router.post(
  "/submit",
  upload.fields([
    { name: "idFile", maxCount: 1 },
    { name: "licenseFile", maxCount: 1 },
    { name: "profileFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        licenseNumber,
        licenseExpiry,
        specialization,
        password,
      } = req.body;

      // Validate required fields
      if (
        !fullName ||
        !email ||
        !phone ||
        !licenseNumber ||
        !licenseExpiry ||
        !password ||
        !req.files["idFile"] ||
        !req.files["licenseFile"] ||
        !req.files["profileFile"]
      ) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Upload files to Cloudinary
      const idUrl = await uploadToCloudinaryBuffer(req.files["idFile"][0].buffer, `${email}_id`, "verification");
      const licenseUrl = await uploadToCloudinaryBuffer(req.files["licenseFile"][0].buffer, `${email}_license`, "verification");
      const profileUrl = await uploadToCloudinaryBuffer(req.files["profileFile"][0].buffer, `${email}_profile`, "verification");

      // Save or update responder record
      const responderRef = db.ref("responders").child(email.replace(/\./g, "_"));
      await responderRef.update({
        fullName,
        email,
        phone,
        licenseNumber,
        licenseExpiry,
        specialization,
        password, 
        idUrl,
        licenseUrl,
        profileUrl,
        verificationStatus: "Pending",
        updatedAt: new Date().toISOString(),
      });

      // Optionally mark the invite code as used
      const inviteSnapshot = await db.ref("inviteCodes").orderByChild("email").equalTo(email).once("value");
      const inviteData = inviteSnapshot.val();
      if (inviteData) {
        const codeKey = Object.keys(inviteData)[0];
        await db.ref("inviteCodes/" + codeKey).update({ used: true });
      }

      // Fetch full responder data to return to frontend
      const finalSnapshot = await responderRef.once("value");
      const responderData = finalSnapshot.val();

      return res.status(200).json({ success: true, message: "Onboarding submitted", responder: responderData });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
