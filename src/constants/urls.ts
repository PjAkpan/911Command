import { routeCreator } from "../utils";

export const urls = {
  health: {
    check: () => routeCreator("check"),
    encrytData: () => routeCreator("encrypt", "post"),
    decryptData: () => routeCreator("decrypt", "post"),
  },
  auth: {
    check: () => routeCreator("check"),
    createAuth: () => routeCreator("signup", "post"),
   // loginAuth: () => routeCreator("signin", "post"),
    // logOutAuth: () => routeCreator("logout", "post"),
    // refreshTokenAuth: () => routeCreator("refresh-token", "post"),
    // forgotPasswordAuth: () => routeCreator("forgot/password", "post"),
    // disabledUserAuth: () => routeCreator("users/me", "post"),



    // reInviteUser: () => routeCreator("re-invite", "post"),
    // googleLoginAuth: () => routeCreator("google"),
    // googleLoginCallbackAuth: () => routeCreator("google/callback"),
    // verifyOtpAuth: () => routeCreator("verify/login", "post"),
    // approveOrRejectAuth: () => routeCreator("approve/reject/account", "post"),
    // accountSetupAuth: () => routeCreator("account-setup", "post"),
    // changePasswordAuth: () => routeCreator("change-password", "post"),
    // verifyForgotPasswordAuth: () =>
    //   routeCreator("verify/forgot-password-token", "post"),
    // verifyAccountSetUpTokenAuth: () =>
    //   routeCreator("verify/account-setup-token", "post"),
  },
};
