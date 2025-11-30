const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// Get verification status of a responder
router.get("/status/:email", async (req, res) => {
  try {
    const emailKey = req.params.email.replace(/\./g, "_");
    const snapshot = await db.ref("responders").child(emailKey).once("value");
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({ success: false, message: "Responder not found" });
    }

    return res.status(200).json({
      success: true,
      verificationStatus: data.verificationStatus, // MATCHES FRONTEND
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
