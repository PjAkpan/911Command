// routes/wallet.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase"); // uses admin.database()

/**
 * Wallet structure (stored under users/{uid}/wallet)
 * {
 *   points: number,
 *   credits: number,
 *   history: [...],
 *   pendingConversions: [{ id, points, ngn, status, ts }]
 * }
 */

// GET /wallet/:uid
router.get("/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    console.log("[Wallet GET] uid=", uid);
    if (!uid) return res.status(400).json({ success: false, message: "UID missing" });

    const snap = await db.ref(`users/${uid}/wallet`).once("value");
    if (!snap.exists()) {
      // initialize default wallet if missing
      const initial = { points: 0, credits: 0, history: [], pendingConversions: [], updatedAt: new Date().toISOString() };
      await db.ref(`users/${uid}/wallet`).set(initial);
      return res.json({ success: true, wallet: initial });
    }
    const wallet = snap.val();
    return res.json({ success: true, wallet });
  } catch (err) {
    console.error("[Wallet GET] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wallet/convert
// body: { uid, points }
router.post("/convert", async (req, res) => {
  try {
    const { uid, points } = req.body;
    console.log("[Wallet CONVERT] uid", uid, "points", points);
    if (!uid || typeof points !== "number") return res.status(400).json({ success: false, message: "uid & points required" });

    const userRef = db.ref(`users/${uid}/wallet`);
    const snap = await userRef.once("value");
    if (!snap.exists()) return res.status(404).json({ success: false, message: "Wallet not found" });

    const wallet = snap.val();
    if ((wallet.points || 0) < points) return res.status(400).json({ success: false, message: "Insufficient points" });

    // compute NGN using configurable rate stored at users/{uid}/walletConfig or default
    const configSnap = await db.ref(`walletConfig`).once("value");
    const config = configSnap.exists() ? configSnap.val() : { conversionRate_NGN_per_point: 0.5, minPointsToConvert: 100, requireAdminApprovalAboveNgN: 10000 };
    const ngn = +(points * config.conversionRate_NGN_per_point).toFixed(2);

    // determine if require approval
    const requiresApproval = ngn > (config.requireAdminApprovalAboveNgN ?? 10000);

    // prepare history & pending conversion record
    const txnId = `conv_${Date.now()}`;
    const historyItem = { id: txnId, type: requiresApproval ? "CONVERT_PENDING" : "CONVERT", desc: requiresApproval ? "Conversion requested (pending approval)" : "Conversion completed", points: -points, credits: requiresApproval ? 0 : ngn, ts: new Date().toISOString() };
    const pendingEntry = { id: txnId, uid, points, ngn, status: requiresApproval ? "pending" : "approved", ts: new Date().toISOString() };

    // update wallet: deduct points immediately, add credits only if approved
    const updatedWallet = {
      ...(wallet || {}),
      points: (wallet.points || 0) - points,
      credits: (wallet.credits || 0) + (requiresApproval ? 0 : ngn),
      history: [historyItem, ...(wallet.history || [])],
      pendingConversions: requiresApproval ? [pendingEntry, ...(wallet.pendingConversions || [])] : (wallet.pendingConversions || []),
      updatedAt: new Date().toISOString(),
    };

    // persist updated wallet and create conversion record for admin listing
    await userRef.set(updatedWallet);
    if (requiresApproval) {
      await db.ref(`walletConversions/${txnId}`).set(pendingEntry);
    }

    console.log("[Wallet CONVERT] saved updated wallet, requiresApproval:", requiresApproval);
    return res.json({ success: true, message: requiresApproval ? "Conversion queued for approval" : "Conversion completed", pending: requiresApproval, wallet: updatedWallet });
  } catch (err) {
    console.error("[Wallet CONVERT] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /wallet/redeem
// body: { uid, amount }
router.post("/redeem", async (req, res) => {
  try {
    const { uid, amount } = req.body;
    console.log("[Wallet REDEEM] uid", uid, "amount", amount);
    if (!uid || typeof amount !== "number") return res.status(400).json({ success: false, message: "uid & amount required" });

    const userRef = db.ref(`users/${uid}/wallet`);
    const snap = await userRef.once("value");
    if (!snap.exists()) return res.status(404).json({ success: false, message: "Wallet not found" });

    const wallet = snap.val();
    if ((wallet.credits || 0) < amount) return res.status(400).json({ success: false, message: "Insufficient promo credits" });

    const txnId = `redeem_${Date.now()}`;
    const historyItem = { id: txnId, type: "REDEEM", desc: "Redeemed for service", points: 0, credits: -amount, ts: new Date().toISOString() };

    const updatedWallet = {
      ...(wallet || {}),
      credits: +( (wallet.credits || 0) - amount ).toFixed(2),
      history: [historyItem, ...(wallet.history || [])],
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(updatedWallet);

    // Optionally create a redemption record for order system
    await db.ref(`walletRedemptions/${txnId}`).set({ uid, amount, status: "applied", ts: new Date().toISOString() });

    console.log("[Wallet REDEEM] success");
    return res.json({ success: true, message: "Redeemed successfully", wallet: updatedWallet });
  } catch (err) {
    console.error("[Wallet REDEEM] error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
