require("dotenv").config();
const express = require("express");
const router = express.Router();
const { sendResponderEmail } = require("../helper/email");
const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");


router.post("/verify/:email", async (req, res) => {
  const { status } = req.body;
  const rawEmail = req.params.email;
  const emailKey = rawEmail.toLowerCase().replace(/\./g, "_");

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const responderRef = db.ref("responders").child(emailKey);
    const snapshot = await responderRef.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Responder not found" });
    }

    const responderData = snapshot.val();

    await responderRef.update({ verificationStatus: status });

    // -------------------------------------------
    // APPROVAL FLOW
    // -------------------------------------------
if (status === "Approved") {
  const responderId = responderData.responderId || `R-${Math.floor(1000 + Math.random() * 9000)}`;

    // Hash the password before storing
  const hashedPassword = await bcrypt.hash(responderData.password, 10);

      await responderRef.update({
    responderId,
    password: hashedPassword
  });


      // Optional push notification
      if (responderData.fcmToken) {
        await sendPushNotification(
          responderData.fcmToken,
          "Responder Approved ✅",
          "Your account has been approved. Check your email for login credentials."
        );
      }

      // Send approval email
      await sendResponderEmail(
        responderData.email,
        "approval",
        "", // nothing needed
        responderData.fullName,
        responderData.password || ""// << THE PASSWORD GOES HERE
      );

    } else {
      // -------------------------------------------
      // REJECTION FLOW
      // -------------------------------------------
      if (responderData.fcmToken) {
        await sendPushNotification(
          responderData.fcmToken,
          "Verification Status Update",
          `Hi ${responderData.fullName || "Responder"}, your verification status is now: ${status}`
        );
      }

      await sendResponderEmail(
        responderData.email,
        "rejection",
        "Your verification was not approved.",
        responderData.fullName
      );
    }

    return res.json({ success: true, message: `Responder ${status}` });

  } catch (err) {
    console.error("❌ Verification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
