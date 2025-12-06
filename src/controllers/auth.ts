import { userService } from "../services/model";
import { HttpStatusCode, getters } from "../config";
import bcrypt from "bcryptjs";
import { createHttpError, errorHandler, responseObject } from "../utils";
import type { RequestHandler } from "express";

const checkServiceHealth: RequestHandler = (...rest) => {
  const res = rest[1];

  return responseObject({
    res,
    message: getters.geti18ns().LOGS.ROUTES.HEALTH_CHECK.SUCCESS,
    statusCode: HttpStatusCode.OK,
  });
};

const Register: RequestHandler = async (req, res) => {
  const { email, phone, password } = req.body;
  let userData = req.body;
  let rolesArray = null;
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

    const hashedPassword = await bcrypt.hash(password, 10);
    userData.email = normalizedEmail;
    userData.phone = normalizedPhone;
    userData.role = rolesArray;
    userData.password = hashedPassword;

    const user = await userService.registerUser(userData);
    if (user.status == true && user.payload) {
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
      statusCode: HttpStatusCode.InternalServerError,
      message: errorHandler(error, null).message,
    });
  }
};

export default {
  checkServiceHealth,
  Register,
};
