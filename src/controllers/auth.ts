 import { userService } from "../services/model";
import { HttpStatusCode, getters } from "../config";
import {
 
    errorHandler,
  responseObject,
} from "../utils";
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
  try {
    const user = await userService.registerUser(req.body);
      if (user.status == true && user.payload) {
    return responseObject({
      res,
      message: user.message || "User registered successfully",
      statusCode: HttpStatusCode.Created,
      payload: user,
    });
}
else{
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

