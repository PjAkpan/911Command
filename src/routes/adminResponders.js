const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

function normalizeEmail(email) {
  return email.toLowerCase().replace(/\./g, "_");
}

// GET ALL RESPONDERS (for Admin Dashboard)
router.get("/responders", async (req, res) => {
  console.log("📌 [ADMIN API] /responders endpoint hit");

  try {
    console.log("📌 Fetching responders from Firebase Realtime DB...");
    const snap = await db.ref("responders").once("value");
    const data = snap.val();
    console.log("📌 Snapshot value:", data);

    if (!data) {
      console.log("⚠️ No responders found in database");
      return res.json([]);
    }

    console.log("📌 Normalizing keys and merging duplicates...");

    const merged = {};

    for (const key in data) {
      const responder = data[key];
      const normalizedKey = normalizeEmail(responder.email || key);

      if (!merged[normalizedKey]) {
        merged[normalizedKey] = { ...responder };
      } else {
        // Merge: keep existing fields, overwrite only if missing
        merged[normalizedKey] = {
          ...responder,
          ...merged[normalizedKey], // existing fields take priority
          verificationStatus: responder.verificationStatus || merged[normalizedKey].verificationStatus || "Pending",
          documents: responder.documents || merged[normalizedKey].documents || {},
        };
      }

      // Optional: if key differs from normalized, clean up old key in Firebase
      if (key !== normalizedKey) {
        await db.ref(`responders/${normalizedKey}`).set(merged[normalizedKey]);
        await db.ref(`responders/${key}`).remove();
      }
    }

    console.log("📌 Merged responders:", merged);


    // Convert to array
    const respondersArray = Object.keys(merged).map((id) => ({
      id,
      ...merged[id],
      verificationStatus: merged[id].verificationStatus || "Pending",
      documents: merged[id].documents || {},
    }));

    console.log("✅ Final responders array:", respondersArray);

      return res.json(respondersArray);

  } catch (err) {
    console.error("❌ ERROR while fetching responders:", err);
    res.status(500).json({ error: "Failed to fetch responders" });
  }
});

module.exports = router;
