const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// POST /api/responder/invite/verify
router.post("/verify", async (req, res) => {
  const { code, email } = req.body;
  console.log("[DEBUG] Incoming request:", { code, email });

  if (!code || !email)
    return res.status(400).json({ success: false, message: "Code and email required" });

  try {
    const inviteRef = db.ref("inviteCodes/" + code.trim());
    const snapshot = await inviteRef.once("value");
    const inviteData = snapshot.val();
    console.log("[DEBUG] Invite data:", inviteData);

    if (!inviteData) {
      console.log("[DEBUG] Invalid invite code");
      return res.status(404).json({ success: false, message: "Invalid invite code" });
    }

    if (inviteData.used) {
      console.log("[DEBUG] Invite code already used");
      return res.status(403).json({ success: false, message: "Invite code already used" });
    }

    if (inviteData.email !== email.trim()) {
      console.log("[DEBUG] Email does not match invite code");
      return res.status(403).json({ success: false, message: "Invite code does not match email" });
    }

    // Mark code as used
    await inviteRef.update({ used: true });
    console.log("[DEBUG] Invite code marked as used");

    // Check responder data
    const respondersRef = db.ref("responders/" + email.replace(".", "_"));
    const responderSnapshot = await respondersRef.once("value");
    const responderData = responderSnapshot.val();
    console.log("[DEBUG] Responder data:", responderData);

    const firstTime = !responderData || responderData.verificationStatus === "Pending";
    const approved = responderData?.verificationStatus === "Approved";
    console.log("[DEBUG] firstTime:", firstTime, "approved:", approved);

    // If first time, set to pending
    if (!responderData) {
      await respondersRef.set({
        email: email.trim(),
        verificationStatus: "Pending",
        createdAt: new Date().toISOString(),
      });
      console.log("[DEBUG] Responder created with Pending status");
    }

    return res.status(200).json({
      success: true,
      message: "Invite verified",
      firstTime,
      approved,
    });
  } catch (err) {
    console.error("[ERROR] Invite verification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
