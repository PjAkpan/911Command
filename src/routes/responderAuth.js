const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");

// POST /responder/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const emailKey = email.replace(/\./g, "_");
  const responderRef = db.ref("responders/" + emailKey);
  const snapshot = await responderRef.once("value");

  if (!snapshot.exists()) {
    // New user, needs invite
    return res.status(403).json({ success: false, inviteRequired: true });
  }

  const responderData = snapshot.val();

  if (responderData.verificationStatus !== "Approved") {
    // Pending verification
    return res.status(403).json({ success: false, verificationPending: true, email: responderData.email });
  }

  // Check password (hashed)
  const validPassword = await bcrypt.compare(password, responderData.password);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // Approved and valid login
  return res.status(200).json({ success: true, responder: responderData });
});

module.exports = router;
