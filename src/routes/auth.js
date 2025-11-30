const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { auth, db } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs"); 


const REFERRAL_BASE_URL = process.env.REFERRAL_BASE_URL || "http://192.168.1.150:8080/signup";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "7d";

// Generate unique referral code
async function generateUniqueReferral() {
  let code;
  let exists = true;

  while (exists) {
    code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char code
    const snapshot = await db.ref("users").orderByChild("referralCode").equalTo(code).once("value");
    exists = snapshot.exists();
  }

  return code;
}

/**
 * USER SIGNUP
 */
router.post("/signup", async (req, res) => {
  console.log("Signup request received:", req.body);
  try {
    const { fullName, phone, email, password, consents } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Normalize phone and email
    const normalizedPhone = phone.startsWith("+") ? phone : `+234${phone}`;
    const normalizedEmail = email.toLowerCase();

    // Check if phone already exists in Realtime DB
    const phoneSnapshot = await db.ref("users").orderByChild("phone").equalTo(normalizedPhone).once("value");
    if (phoneSnapshot.exists()) {
       console.log("Phone already exists:", normalizedPhone);
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered.",
      });
    }

    // Check if email already exists in Firebase Auth
        console.log("Checking if email exists...");
    let emailExists = false;
    try {
     await auth.getUserByEmail(normalizedEmail);
      emailExists = true;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.error("Unexpected Firebase Auth error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
    if (emailExists) {
      console.log("Email already exists:", normalizedEmail);
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    console.log("Email is available");

    // Create Firebase Auth user
       console.log("Creating Firebase Auth user...");
    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: fullName,
      phoneNumber: normalizedPhone,
    });
   console.log("Firebase user created:", userRecord.uid);
    // Generate unique referral code
    const referralCode = await generateUniqueReferral();
    const timestamp = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);
    // Save profile in Realtime Database
    console.log("Saving user in Realtime DB...");
    const userDoc = {
      uid: userRecord.uid,
      fullName,
      phone: normalizedPhone,
      email: normalizedEmail,
      referralCode,
      consents,
      password: hashedPassword,
      createdAt: timestamp,
      role: "user",
      status: "pending_verification",
    };

    await db.ref("users/" + userRecord.uid).set(userDoc);
    console.log("User saved in Realtime DB");
    const referralUrl = `${REFERRAL_BASE_URL}?ref=${referralCode}`;
    console.log("Signup successful, sending response");
    return res.json({
      success: true,
      message: "Account created successfully",
      user: {
        uid: userRecord.uid,
        fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        referralCode,
        referralUrl,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    let message = error.message || "Signup failed";

    if (error.code === "auth/email-already-exists") message = "Email already registered";
    else if (error.code === "auth/invalid-password") message = "Password invalid (min 6 chars)";
    else if (error.code === "auth/invalid-phone-number") message = "Phone number invalid";


    return res.status(500).json({ success: false, message });
  }
});

/**
 * USER
 * SIGN IN
 * Supports email or phone number
 */

router.post("/signin", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

  // Normalize email/phone
    let queryField = identifier.includes("@") ? "email" : "phone";
    let queryValue = identifier;

   if (queryField === "phone") {
      queryValue = identifier.startsWith("+") ? identifier : `+234${identifier.replace(/^0/, "")}`;
    } else {
      queryValue = identifier.toLowerCase();
    }

      // Fetch user from Realtime DB
 const snapshot = await db.ref("users").orderByChild(queryField).equalTo(queryValue).once("value");

 if (!snapshot.exists()) {
      return res.status(400).json({ success: false, message: `${queryField} not registered.` });
    }
  const userDataRaw = snapshot.val();
  const uid = Object.keys(userDataRaw)[0];
  const userData = userDataRaw[uid];
  
 // Verify password
 const passwordMatch = await bcrypt.compare(password, userData.password);
   if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid password." });
    }

    // Create JWT token
    const token = jwt.sign(
   {
        uid: userData.uid,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || "user",
    },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Signed in successfully",
      user: {
        uid: userData.uid,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        referralCode: userData.referralCode,
        referralUrl: `${REFERRAL_BASE_URL}?ref=${userData.referralCode}`,
        status: userData.status,
      },
      token,
    });
  } catch (error) {
    console.error("SIGNIN ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Signin failed" });
  }
});

/**
 * USER LOGOUT
 */

// Logout (just frontend cleanup, optional backend handling)
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Optional: you can revoke refresh tokens
    await auth.revokeRefreshTokens(req.user.uid);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * USER Delete Account
 */
router.delete("/users/me", authMiddleware, async (req, res) => {
  const uid = req.user.uid;

  try {
    // 1️⃣ Delete wallet from Realtime DB
    await db.ref(`wallets/${uid}`).remove();

    // 2️⃣ Delete user data from Realtime DB (if you store additional profile info)
    await db.ref(`users/${uid}`).remove();

    // 3️⃣ Delete Firebase Auth user
    await auth.deleteUser(uid);

    res.status(200).json({ message: "Account and wallet deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete account" });
  }
});


module.exports = router;
