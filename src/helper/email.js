require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send responder email
 * @param {string} to - recipient email
 * @param {string} type - "invite" | "approval" | "rejection"
 * @param {string} codeOrMessage - invite code OR rejection message
 * @param {string} fullName - responder name
 * @param {string} password - ONLY for approval email
 */
async function sendResponderEmail(to, type, codeOrMessage = "", fullName = "", password = "") {
  let subject = "";
  let html = "";

  switch (type) {
    case "invite":
      subject = "Your Alera Pro Responder Temporary Login";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h3>Responder Onboarding Access</h3>
          <p>Your temporary login code:</p>
          <div style="background:#0a2a43; color:#fff; padding:12px; display:inline-block; border-radius:6px; font-size:22px;">
            ${codeOrMessage}
          </div>
        </div>
      `;
      break;

    case "approval":
      subject = "Your Responder Account is Approved ✅";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h3>Welcome to the Health Pro Team, ${fullName || "Responder"}!</h3>
          <p>Your account has been approved.</p>
          <p><strong>Your login credentials:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${to}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please change your password after first login.</p>
        </div>
      `;
      break;

    case "rejection":
      subject = "Responder Verification Update ❌";
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h3>Hello ${fullName || "Responder"},</h3>
          <p>Your responder verification <strong>was not approved</strong>.</p>
          <p>${codeOrMessage}</p>
        </div>
      `;
      break;

    default:
      throw new Error("Invalid email type");
  }

  return transporter.sendMail({
    from: `"Alera Pro" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendResponderEmail };
