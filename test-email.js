require("dotenv").config();
const { sendInviteEmail } = require("./src/helper/email");

sendInviteEmail("peacejohns995@gmail.com", "ALR-TEST123")
  .then(() => console.log("Email sent successfully!"))
  .catch(console.error);
