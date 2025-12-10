import { otpService, userService } from "../services/model";
import { HttpStatusCode, getters } from "../config";
import bcrypt from "bcryptjs";
import { createHttpError, errorHandler, generateAccessToken, generateReferralCode, responseObject, sendNotificationMail } from "../utils";
import type { RequestHandler } from "express";
import { constants } from "../constants";
const { typeEnum, channelTypeEnum, MailType } =
  constants.generalConstant.en.templateData;



const checkServiceHealth: RequestHandler = (...rest) => {
  const res = rest[1];

  return responseObject({
    res,
    message: getters.geti18ns().LOGS.ROUTES.HEALTH_CHECK.SUCCESS,
    statusCode: HttpStatusCode.OK,
  });
};

const Register: RequestHandler = async (req, res) => {
  const {fullName, email, phone, password } = req.body;
  const salt: string = await bcrypt.genSalt(10);
  let userData = req.body;
  let rolesArray = null;
  const REFERRAL_BASE_URL =getters.getAppUrls().frontendUrl || "http://192.168.1.150:8080/signup";

  
  try {
    rolesArray = JSON.stringify(["CUSTOMER"]);
    // Normalize phone and email
    const normalizedPhone = phone.startsWith("+") ? phone : `+234${phone}`;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await userService.findOneUser({
      email: normalizedEmail,
    });

    if (existingUser.status) {
      throw createHttpError("Email already registered", 422);
    }

    const existingPhone = await userService.findOneUser({
      phone: normalizedPhone,
    });

    if (existingPhone.status) {
      throw createHttpError("Phone number already registered", 422);
    }
    const referralCode =await generateReferralCode();
    const hashedPassword = await bcrypt.hash(password, salt);
    userData.email = normalizedEmail;
    userData.phone = normalizedPhone;
    userData.role = rolesArray;
    userData.password = hashedPassword;
    userData.referralCode= referralCode;
    userData.referralUrl= `${REFERRAL_BASE_URL}?ref=${referralCode}`;

    const user = await userService.registerUser(userData);
    if (user.status == true && user.payload) {

      const regData = await otpService.sendOtp(
        {
          channel: email,
          type: typeEnum.VERIFICATION,
          channelType: channelTypeEnum.EMAIL,
        },
        userData,
      );
      if (!regData.status) {
        return responseObject({
          res,
          statusCode:
               regData.statusCode ?? HttpStatusCode.InternalServerError,
          message: regData?.message ?? "Failed to save save otp request",
        });
      }
      await sendNotificationMail(MailType.REG_SUCCESS, {
        name: fullName,
        to: email,
        cc: getters.getAppSecrets().ccEmail,
        bcc: getters.getAppSecrets().bccEmail,
        template: "sendEmailDefaultNew",
        metadata: {
          // Additional structured data if your system supports it
          quickActions: [
            { text: "Complete Profile", url: "/profile" },
            { text: "Verify Email", url: "/verify-email" },
            { text: "Help Center", url: "/help" },
          ],
        },
        templateType: "notification",
      });

      await sendNotificationMail(typeEnum.VERIFICATION, {
        name: fullName,
        to: email,
        cc: getters.getAppSecrets().ccEmail,
        bcc: getters.getAppSecrets().bccEmail,
        template: "sendEmailDefaultNew",
        metadata: {
          // Additional structured data if your system supports it
          quickActions: [
            { text: "Complete Profile", url: "/profile" },
            { text: "Verify Email", url: "/verify-email" },
            { text: "Help Center", url: "/help" },
          ],
        },
        templateType: "otp",
        otp: regData.payload?.otp,
      });


      return responseObject({
        res,
        message: user.message || "User registered successfully",
        statusCode: HttpStatusCode.Created,
        payload: user.payload,
      });
    } else {
      return responseObject({
        res,
        message: user.message || "User registration failed",
        statusCode: HttpStatusCode.UnprocessableEntity,
        payload: user.payload,
      });
    }
  } catch (error) {
    return responseObject({
      res,
      statusCode:(error as any).status || HttpStatusCode.InternalServerError,
      message: errorHandler(error, null).message,
    });
  }
};

const  Login : RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  let payload = null;
  try {
    const userExists = await userService.findOneUser({ email: email });

    if (userExists.status == false) {
      return responseObject({
        res,
        statusCode: HttpStatusCode.NotFound,
        message: `user with email ${email}   not found`,
        payload,
      });
    }
    const isPasswordValid = bcrypt.compareSync(
      password,
      (userExists.payload as any)?.password ?? "",
    );
    if (!isPasswordValid) {
      return responseObject({
        res,
        statusCode: HttpStatusCode.Unauthorized,
        message: "Invalid login credentials",
      });
    }
    const token = await generateAccessToken(
      {
        publicId: (userExists.payload as any)?.id,
        email: (userExists.payload as any)?.email,
        phone: (userExists.payload as any)?.phone,
        name: (userExists.payload as any)?.fullName,
        role: (userExists.payload as any)?.role,
        isVerified: (userExists.payload as any)?.isVerified,
        status: (userExists.payload as any)?.status,
        referralCode: (userExists.payload as any)?.referralCode,
        referralUrl: (userExists.payload as any)?.referralUrl,
      },
      "LOGIN",
      "10m",
    );

    return responseObject({
      res,
      statusCode: HttpStatusCode.OK,
      message: "Signed in successfully",
      payload: token,
    });
  
  } catch (error) {
  
    console.error("SIGNIN ERROR:", error);
    return responseObject({
      res,
      statusCode:(error as any).status || HttpStatusCode.InternalServerError,
      message: errorHandler(error, null).message,
    });

  }
};

export default {
  checkServiceHealth,
  Register,
  Login,
};
