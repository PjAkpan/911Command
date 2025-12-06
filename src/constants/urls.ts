import { routeCreator } from "../utils";

export const urls = {
  health: {
    check: () => routeCreator("check"),
    encrytData: () => routeCreator("encrypt", "post"),
    decryptData: () => routeCreator("decrypt", "post"),
  },
  // auth: {
  //   check: () => routeCreator("check"),
  //   reInviteUser: () => routeCreator("re-invite", "post"),
  //   googleLoginAuth: () => routeCreator("google"),
  //   googleLoginCallbackAuth: () => routeCreator("google/callback"),
  //   createAuth: () => routeCreator("signup", "post"),
  //   loginAuth: () => routeCreator("login", "post"),
  //   verifyOtpAuth: () => routeCreator("verify/login", "post"),
  //   approveOrRejectAuth: () => routeCreator("approve/reject/account", "post"),
  //   accountSetupAuth: () => routeCreator("account-setup", "post"),
  //   changePasswordAuth: () => routeCreator("change-password", "post"),
  //   logOutAuth: () => routeCreator("logout", "post"),
  //   verifyForgotPasswordAuth: () =>
  //     routeCreator("verify/forgot-password-token", "post"),
  //   verifyAccountSetUpTokenAuth: () =>
  //     routeCreator("verify/account-setup-token", "post"),
  //   refreshTokenAuth: () => routeCreator("refresh-token", "post"),
  //   forgotPasswordAuth: () => routeCreator("forgot/password", "post"),
  // }, 
};
