import { otpSchemaType } from "../../models/types";
import { HttpStatusCode } from "../../config";
import { otpModel } from "../../models";
import { generateAccessToken, generateOtp, generateTransactionRef, shortenTransactionRef } from "../../utils";

const { OtpModel } = otpModel;

export const sendOtp = async (data: Partial<otpSchemaType>,requestData?:any) => {
  try {
    const otpCode = await generateOtp(4);
    const token = await generateAccessToken(
      {
        id:requestData.email,
      },
      "VERIFICATION_OTP",
      "10m",
    );
    const userCode =await generateTransactionRef(10, true).then(shortenTransactionRef);
    data.userCode = userCode || Math.floor(100000 + Math.random() * 900000).toString();
    data.accessToken =
      token.accessToken || Math.random().toString(36).substring(2);
    data.otp = otpCode || Math.floor(100000 + Math.random() * 900000).toString();
    const created = await OtpModel.create(data);
    return {
      status: true,
      statusCode: HttpStatusCode.Created,
      message: "otp request created successfully",
      payload: created,
    };
  } catch (err) {
    console.error("Error creating otp request:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error creating otp request",
      payload: null,
    };
  }
};

export const findOneOtp = async (filter: Record<string, any>) => {
  try {
    const found = await OtpModel.findOne({
      where: filter,
    });

    return found
      ? {
        status: true,
        statusCode: HttpStatusCode.OK,
        message: "otp request found",
        payload: found,
      }
      : {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "otp request not found",
        payload: null,
      };
  } catch (err) {
    console.error("Error finding otp:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error finding otp",
      payload: null,
    };
  }
};


export const invalidateOtp = async (filter: Record<string, any>) => {
  try {
    const deletedCount = await OtpModel.destroy({
      where: filter,
    });

    if (deletedCount === 0) {
      return {
        status: false,
        statusCode: HttpStatusCode.NotFound,
        message: "OTP not found or already invalidated",
        payload: null,
      };
    }

    return {
      status: true,
      statusCode: HttpStatusCode.OK,
      message: "OTP invalidated successfully",
      payload: { deletedCount },
    };
  } catch (err) {
    console.error("Error invalidating OTP:", err);
    return {
      status: false,
      statusCode: HttpStatusCode.InternalServerError,
      message: (err as Error).message || "Error invalidating OTP",
      payload: null,
    };
  }
};
