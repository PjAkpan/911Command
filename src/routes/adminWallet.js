// routes/adminWallet.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

/**
 * GET /admin/wallet/conversions
 * lists pending conversions
 */
router.get("/conversions", async (req, res) => {
  try {
    const snap = await db.ref("walletConversions").once("value");
    const list = snap.exists() ? snap.val() : {};
    // return as array
    const arr = Object.keys(list).map(k => ({ id: k, ...list[k] }));
    return res.json({ success: true, conversions: arr });
  } catch (err) {
    console.error("[AdminConversions GET] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /admin/wallet/conversions/:id/approve
 * Approves a conversion: sets conversion status, adds credits to user's wallet entry (if not already), updates history
 */
router.post("/conversions/:id/approve", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("[Admin APPROVE] id", id);
    const convSnap = await db.ref(`walletConversions/${id}`).once("value");
    if (!convSnap.exists()) return res.status(404).json({ success: false, message: "Conversion not found" });

    const conv = convSnap.val();
    if (conv.status === "approved") return res.json({ success: true, message: "Already approved" });

    // credit user's wallet credits
    const uid = conv.uid;
    const userWalletRef = db.ref(`users/${uid}/wallet`);
    const wSnap = await userWalletRef.once("value");
    const wallet = wSnap.exists() ? wSnap.val() : { points: 0, credits: 0, history: [], pendingConversions: [] };

    // Add credits
    wallet.credits = +( (wallet.credits || 0) + conv.ngn ).toFixed(2);

    // Update history: find pending history item by id and mark as completed (or add new)
    const historyEntry = { id: `conv_complete_${Date.now()}`, type: "CONVERT", desc: "Conversion approved by admin", points: 0, credits: conv.ngn, ts: new Date().toISOString(), meta: { originalConversionId: id } };
    wallet.history = [historyEntry, ...(wallet.history || [])];

    // remove pending conversion from wallet.pendingConversions (if present)
    wallet.pendingConversions = (wallet.pendingConversions || []).filter((p) => p.id !== id);

    // persist wallet and update conversion record
    await userWalletRef.set({ ...wallet, updatedAt: new Date().toISOString() });

    await db.ref(`walletConversions/${id}`).update({ status: "approved", approvedAt: new Date().toISOString() });

    console.log("[Admin APPROVE] done for id", id);
    return res.json({ success: true, message: "Conversion approved", wallet });
  } catch (err) {
    console.error("[Admin APPROVE] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /admin/wallet/conversions/:id/reject
 * Rejects conversion and refunds points back to user's wallet
 * body: { reason }
 */
router.post("/conversions/:id/reject", async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    console.log("[Admin REJECT] id", id, "reason", reason);
    const convSnap = await db.ref(`walletConversions/${id}`).once("value");
    if (!convSnap.exists()) return res.status(404).json({ success: false, message: "Conversion not found" });

    const conv = convSnap.val();
    if (conv.status === "rejected") return res.json({ success: true, message: "Already rejected" });

    const uid = conv.uid;
    const userWalletRef = db.ref(`users/${uid}/wallet`);
    const wSnap = await userWalletRef.once("value");
    const wallet = wSnap.exists() ? wSnap.val() : { points: 0, credits: 0, history: [], pendingConversions: [] };

    // refund points (since we deducted at request)
    wallet.points = (wallet.points || 0) + (conv.points || 0);

    // mark history
    const historyEntry = { id: `conv_reject_${Date.now()}`, type: "CONVERT_REJECT", desc: `Conversion rejected: ${reason || "no reason provided"}`, points: conv.points, credits: 0, ts: new Date().toISOString(), meta: { originalConversionId: id } };
    wallet.history = [historyEntry, ...(wallet.history || [])];

    // remove pending conversion from wallet.pendingConversions
    wallet.pendingConversions = (wallet.pendingConversions || []).filter((p) => p.id !== id);

    await userWalletRef.set({ ...wallet, updatedAt: new Date().toISOString() });
    await db.ref(`walletConversions/${id}`).update({ status: "rejected", rejectedAt: new Date().toISOString(), reason: reason || "" });

    console.log("[Admin REJECT] done for id", id);
    return res.json({ success: true, message: "Conversion rejected and points refunded", wallet });
  } catch (err) {
    console.error("[Admin REJECT] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
