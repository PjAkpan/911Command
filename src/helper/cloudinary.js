const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function sanitizeForCloudinary(str) {
  if (typeof str !== "string") str = String(str);
  return str.trim().replace(/[^a-zA-Z0-9-_]/g, "_");
}

// Original upload function (used elsewhere)
async function uploadToCloudinaryBuffer(fileBuffer, filename, folder = "default") {
  if (typeof filename !== "string") {
    throw new Error("Filename must be a string");
  }

  const safeFileName = sanitizeForCloudinary(filename);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto", public_id: `${folder}/${safeFileName}` },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      )
      .end(fileBuffer);
  });
}

// New function for verification uploads
async function uploadVerificationFiles(uid, idBuffer, selfieBuffer) {
  const idUrl = await uploadToCloudinaryBuffer(idBuffer, `${uid}_id`, "verification");
  const selfieUrl = await uploadToCloudinaryBuffer(selfieBuffer, `${uid}_selfie`, "verification");
  return { idUrl, selfieUrl };
}


// Export both functions
module.exports = { uploadToCloudinaryBuffer, uploadVerificationFiles };
