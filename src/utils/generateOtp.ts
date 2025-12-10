import { randomInt } from "crypto";

export const generateOtp = async (length = 4) => {
  const otpArray = [];
  for (let i = 0; i < length; i++) {
    otpArray.push(randomInt(10));
  }

  const otp = otpArray.join("");
  return await Promise.resolve(otp); // Simulated asynchronous return
};

export const generateReferralCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase();
  let result = timestamp;
  
  for (let i = result.length; i < length; i++) {
    result += chars[randomInt(chars.length)];
  }
  
  return result.substring(0, length);
};
