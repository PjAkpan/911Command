// router.post("/approve/:uid", async (req, res) => {
//   try {
//     const { uid } = req.params;

//     await update(dbRef(db, `users/${uid}`), {
//       verified: true,
//       verificationStatus: "approved"
//     });

//     return res.json({ success: true, message: "User verified successfully." });

//   } catch (err) {
//     console.error("Verify error:", err);
//     return res.status(500).json({ success: false });
//   }
// });
