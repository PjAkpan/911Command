// routes/paystackWebhook.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { db } = require("../config/firebase");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

router.post("/paystack-webhook", express.json({ type: "*/*" }), async (req, res) => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(403).send("Invalid signature");
  }

  const event = req.body;
  if (event.event === "charge.success") {
    const bookingId = event.data.metadata.bookingId;

    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snapshot = await bookingRef.once("value");

    if (snapshot.exists()) {
      await bookingRef.update({
        paymentStatus: "paid",
        paymentReference: event.data.reference,
        paymentConfirmedAt: new Date().toISOString(),
      });
    }
  }

  res.sendStatus(200);
});

module.exports = router;






 