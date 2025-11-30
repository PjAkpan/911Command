const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { db } = require("../config/firebase");
const { sendResponderEmail } = require("../helper/email");

// Generate invite
router.post("/generate", async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ success: false, message: "Email required" });

  try {
    const code = "ALR-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    await db.ref("inviteCodes/" + code).set({ 
      code,
      email,
      used: false,
      generatedAt: new Date().toISOString(),
    });

    // Send the invite email using the unified email function
    await sendResponderEmail(email, "invite",  code , "New Responder");

    return res.status(200).json({ success: true, code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// Get all invite codes
router.get("/all", async (req, res) => {
  try {
    const snapshot = await db.ref("inviteCodes").once("value");
    const data = snapshot.val() || {};
    const codes = Object.values(data);
    res.json({ success: true, codes });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
