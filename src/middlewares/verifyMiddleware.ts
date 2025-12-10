import { NextFunction, RequestHandler, Response } from "express";
import { createHttpError, errorHandler, responseObject } from "../utils";
import { logger } from "netwrap";
import { Helpers } from "src/types/types";
import {
  ValidateviewAllValidation, 
  inputRequestShouldBeEncrypted,
  loginAuthInputValidation,
  signupAuthInputValidation,  
} from "../utils/validate"; 
import { userService } from "../services/model";
import { HttpStatusCode } from "../config";


const createValidationMiddleware = (
  validationFn: (data: object) => {
    error?: { details: { message: string }[] };
  },
  targets: Helpers.ValidationTarget[] = ["body"],
): RequestHandler => {
  return (req: Helpers.ExtendedRequest, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = "Fatal error occurred";

    try {
    ////// console.log("Targets for validation req------:", req);
      // Combine multiple targets into a single object
      const dataToValidate: Record<string, any> = {};
      if (targets.includes("body")) dataToValidate.body = req.body;
      if (targets.includes("query")) dataToValidate.query = req.query;
      if (targets.includes("params")) dataToValidate.params = req.params;
      if (targets.includes("files")) dataToValidate.files = req.files;
      // let dataToValidate;

      // if (target === "body") {
      //   dataToValidate = req.body;
      // } else if (target === "query") {
      //   dataToValidate = req.query;
      // } else {
      //   dataToValidate = req.params;
      // }

      const { error } = validationFn(dataToValidate);
      if (error) {
        statusCode = 400;
        message = error.details[0].message;
        throw createHttpError(message, statusCode);
      }
      next();
    } catch (err) {
      logger(err, { shouldLog: true, isError: true });

      message = (err as Error).message;
      return responseObject({
        res,
        statusCode: statusCode,
        message: errorHandler(err as Error, null)?.message || message,
      });
    }
  };
};

const verifyActiveStatus: RequestHandler = async (req, res, next) => {
  let payload = {};
  try {
    const { email } = req.body;
    // Simulate fetching user from database
    const userExists = await userService.findOneUser({ email: email });
    
    if (userExists.status == false) {
      return responseObject({
        res,
        statusCode: HttpStatusCode.NotFound,
        message: `user with email ${email}   not found`,
        payload,
      });
    }
 
    if (userExists.payload && (userExists.payload as any).status != "active") {
      throw createHttpError("User is not active", 403);
    }

    next();
  }
  catch (err) {
    logger(err, { shouldLog: true, isError: true });
    return responseObject({
      res,
      statusCode: (err as any).status || 500,
      message: errorHandler(err as Error, null)?.message || "Internal Server Error",
    });
  }
};
 

const validateEncrtptedInput = createValidationMiddleware(
  inputRequestShouldBeEncrypted,
  ["body"],
);

const validateVeiwAllInput = createValidationMiddleware(
  ValidateviewAllValidation,
  ["query"],
);

const validateRegisterInput = createValidationMiddleware(
  signupAuthInputValidation,
  ["body"],
);

const validateLoginInput = createValidationMiddleware(
  loginAuthInputValidation,
  ["body"],
);

// const validateCreateUsersRequest = createValidationMiddleware(
//   addusersInputValidation,
//   ["body"],
// );

 
 

const verifyMiddleware = {
  validateEncrtptedInput,
  validateVeiwAllInput,
  validateRegisterInput,
  validateLoginInput,
  verifyActiveStatus,
};

export { verifyMiddleware };
