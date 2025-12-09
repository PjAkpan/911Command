import {
  ValidateviewAllValidation,
  inputRequestShouldBeEncrypted,
  signupAuthInputValidationSchema,
  loginAuthInputValidationSchema,
} from "./validate";

/**
 * Map middleware validator keys to their respective Joi validator functions
 */
export const joiSchemasMap: Record<string, Function> = {
  validateVeiwAllInput: ValidateviewAllValidation,
  validateEncrtptedInput: inputRequestShouldBeEncrypted,
  validateRegisterInput: signupAuthInputValidationSchema,
  validateLoginInput: loginAuthInputValidationSchema,
};