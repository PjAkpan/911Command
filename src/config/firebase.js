require("dotenv").config();
const admin = require("firebase-admin");
const { uploadToCloudinaryBuffer } = require("../helper/cloudinary");

// Initialize Firebase Admin
const serviceAccount = require("./command-cdd66-firebase-adminsdk-fbsvc-ac5329ad95.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://command-cdd66-default-rtdb.firebaseio.com",
});

const db = admin.database();
const auth = admin.auth();

/**
 * Upload ID and Selfie buffers to Cloudinary
 * @param {string} userId
 * @param {Buffer} idBuffer
 * @param {Buffer} selfieBuffer
 * @returns {Promise<{idUrl: string, selfieUrl: string}>}
 */
async function uploadVerificationFiles(userId, idBuffer, selfieBuffer) {
  // Upload ID and selfie using the existing buffer-based helper
  const idUrl = await uploadToCloudinaryBuffer(idBuffer, `${userId}_id`, `verification/${userId}`);
  const selfieUrl = await uploadToCloudinaryBuffer(selfieBuffer, `${userId}_selfie`, `verification/${userId}`);

  return { idUrl, selfieUrl };
}

module.exports = { db, auth, uploadVerificationFiles };
