// import Joi, { ObjectSchema } from "joi";
//import { constants } from "../constants";

import Joi from "joi";

export const multipartRoutes: Record<string, boolean> = {
  validateDocumentUploadRequest: true, // your docUpload endpoint
};

const ValidateviewAllValidation = (data: any) => {
  const schema = Joi.object({
    status: Joi.string()
      .optional()
      .allow("")
      .valid("pending", "active", "disabled"),
    orderBy: Joi.string().optional().allow(""),
    sort: Joi.string().optional().allow("").valid("ASC", "DESC"),
    size: Joi.string().optional().allow(""),
    page: Joi.string().optional().allow(""),
    gSearch: Joi.any().optional().allow(""),
    option: Joi.any().optional().allow(""),
    requestType: Joi.string()
      .optional()
      .allow("")
      .valid("DOMI", "EXPORT", "IEMARKET", "rollOver", "liquidate"),
    startDate: Joi.string()
      .optional()
      .allow("")
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .message("startDate must be in the format YYYY-MM-DD"),

    endDate: Joi.string()
      .optional()
      .allow("")
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .message("endDate must be in the format YYYY-MM-DD"),
    swapType: Joi.string().optional().allow(""),
  });
  return schema.validate(data.body);
};

const ValidateEncrtptedValidation = (data: any) => {
  const schema = Joi.object({
    textData: Joi.string().required(),
  });
  return schema.validate(data.body);
};
const inputRequestShouldBeEncrypted = (data: any) => {
  const schema = Joi.object({
    textData: Joi.string().required(),
  });
  return schema.validate(data.body);
};

const loginAuthInputValidationSchema = (): Joi.ObjectSchema =>
  Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().trim().required().messages({
      "any.required": "Password is required",
    }),
  });

const loginAuthInputValidation = (data: any) =>
  loginAuthInputValidationSchema().validate(data.body, { abortEarly: false });
const signupAuthInputValidationSchema = (): Joi.ObjectSchema =>
  Joi.object({
    fullName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .example("kenneth akpan")
      .messages({
        "string.base": "fullName must be a string",
        "string.empty": "fullName is required",
        "string.min": "fullName must be at least 2 characters",
        "any.required": "fullName is required",
      }),
    email: Joi.string()
      .email()
      .required()
      .example("kennydevs@proton.me")
      .messages({
        "string.email": "Please enter a valid email address",
        "any.required": "Email is required",
      }),
    phone: Joi.string().trim().required().example("08081416695").messages({
      "any.required": "phone number is required",
    }),
    address: Joi.string()
      .trim()
      .required()
      .example("12 Palm Avenue, Lagos")
      .messages({
        "any.required": "Address is required",
      }),
    consents: Joi.boolean().required().example(true).messages({
      "any.required": "consents is required",
    }),

    password: Joi.string()
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?]).{8,20}$",
        ),
      )
      .required()
      .example("Password@123")
      .messages({
        "string.pattern.base":
          "Password must be 8-19 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "Password is required",
      }),
  });

const signupAuthInputValidation = (data: any) =>
  signupAuthInputValidationSchema().validate(data.body, { abortEarly: false });

export {
  ValidateviewAllValidation,
  inputRequestShouldBeEncrypted,
  ValidateEncrtptedValidation,
  loginAuthInputValidation,
  signupAuthInputValidation,
  signupAuthInputValidationSchema,
};
