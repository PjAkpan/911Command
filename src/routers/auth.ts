import { constants } from "../constants";
import { RouteHandler } from "src/types/route";
import { joinUrls } from "../utils";
import controllers from "../controllers";
import { verifyMiddleware } from "../middlewares";

const serviceLoader: RouteHandler[] = [
  {
    path: joinUrls([constants.urls.auth.check().path]),
    method: constants.urls.auth.check().method,
    handlers: [controllers.auth.checkServiceHealth],
  },
  {
    path: joinUrls([constants.urls.auth.createAuth().path]),
    method: constants.urls.auth.createAuth().method,
    handlers: [verifyMiddleware.validateRegisterInput, controllers.auth.Register],
  },
//   {
//     path: joinUrls([constants.urls.auth.loginAuth().path]),
//     method: constants.urls.auth.loginAuth().method,
//     handlers: [verifyMiddleware.validateLoginInput, controllers.auth.Login],
//   },
];

export default serviceLoader;
