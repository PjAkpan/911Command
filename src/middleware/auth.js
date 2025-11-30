// middleware/auth.js
const { auth } = require("../config/firebase");

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { authMiddleware };
