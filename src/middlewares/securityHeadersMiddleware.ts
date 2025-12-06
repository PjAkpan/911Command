import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import crypto from "crypto";

const securityHeadersMiddleware = (app: any) => {
  // Use helmet to set basic security headers
  app.use(helmet());
  const nonce = crypto.randomBytes(16).toString("base64");

  // Additional configurations for specific headers
  app.use(helmet.frameguard({ action: "deny" })); // X-Frame-Options
  app.use(helmet.noSniff()); // X-Content-Type-Options
  app.use(helmet.referrerPolicy({ policy: "no-referrer" })); // Referrer-Policy

  // Custom Content-Security-Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "http://192.168.0.104:8006",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:8091",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://192.168.0.104:8006",
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:8091",
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        frameSrc: ["'self'"],
      },
    }),
  );

  // Custom Permission-Policy
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=(), fullscreen=(), sync-xhr=()",
    );
    next();
  });

  // Set Cross-Origin-Embedder-Policy
  app.use((req: Request, res: Response, next: NextFunction) => {
    //res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  });

  // Set Cross-Origin-Resource-Policy
  app.use((req: Request, res: Response, next: NextFunction) => {
    // res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });

  // Set Cross-Origin-Opener-Policy
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Remove a specific header
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.removeHeader("Server"); // Remove the Server header completely
    next();
  });
  app.disable("x-powered-by");
};

export { securityHeadersMiddleware };
