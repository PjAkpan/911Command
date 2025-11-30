const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

router.post("/initiate", async (req, res) => {
  try {
    const { bookingId, amount, email } = req.body;

    if (!amount || !email) {
      return res.json({ success: false, message: "Amount or email missing" });
    }

    // Create Paystack transaction
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // convert to kobo
          metadata: { bookingId },
        }),
      }
    );

    const data = await paystackRes.json();

    if (!data.status) {
      return res.json({ success: false, message: data.message });
    }

    return res.json({
      success: true,
      checkoutUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: "Payment initialization failed",
    });
  }
});

router.get("/verify/:reference", async (req, res) => {
  try {
    const ref = req.params.reference;

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = await paystackRes.json();

    if (!data.status) {
      return res.json({ success: false, message: data.message });
    }

    const status = data.data.status;

    if (status === "success") {
      // update booking
      await db.bookings.update({ reference: ref }, { status: "paid" });

      return res.json({ success: true });
    }

    return res.json({ success: false, message: "Payment not completed" });
  } catch (err) {
    return res.json({ success: false });
  }
});


module.exports = router;
