// src/swagger/swagger-auto-routes.ts
import { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";
import { urls } from "../constants/urls";
import { getters } from "../config";
import { joiSchemasMap } from "../utils/joiSchemasMap";
import {  getSwaggerSchemaFromJoi } from "../utils";
import { verifyMiddleware } from ".";
import { logger } from "netwrap";
import { multipartRoutes } from "../utils/validate";

logger("🧠 [swagger-auto-routes] Module loaded.");
const basePath = `/${getters.getAppSecrets().BASEPATH}`;

// ⚡ MEMORY FIX 1: Lazy load routers only when needed
let allRoutersCache: any[] | null = null;

const loadRouters = () => {
  if (allRoutersCache) return allRoutersCache;

  const routersDir = path.resolve(__dirname, "../routers");
  const routers: any[] = [];

  logger(`📂 Reading routers from: ${routersDir}`);

  fs.readdirSync(routersDir).forEach((file) => {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      try {
        const routeModule = require(path.join(routersDir, file));
        const routerExport =
          routeModule.default ||
          Object.values(routeModule).find((v) => Array.isArray(v));
        if (routerExport) {
          routers.push(routerExport);
          logger(`✅ Loaded router: ${file}`);
        }
      } catch (err) {
        console.error(`❌ Error loading router ${file}:`, err);
      }
    }
  });

  allRoutersCache = routers;
  return routers;
};

const tempFile = path.resolve(__dirname, "../temp/swagger-auto-routes.ts");

const normalizePath = (p: string) => p.replace(/^\/+/, "").replace(/\/+$/, "");

const findMatchingRoute = (path: string, method: string) => {
  const allRouters = loadRouters();
  const normPath = normalizePath(path);
  for (const router of allRouters) {
    const match = router.find(
      (r: any) =>
        normalizePath(r.path) === normPath &&
        r.method?.toLowerCase() === method.toLowerCase(),
    );
    if (match) return match;
  }
  return null;
};

// ⚡ MEMORY FIX 2: Stream writing instead of building large string
const generateSwaggerComments = (): void => {
  logger("\n🟢 Starting Swagger comment generation...\n");

  fs.mkdirSync(path.dirname(tempFile), { recursive: true });
  const writeStream = fs.createWriteStream(tempFile);

  let routeCount = 0;

  const processObject = (obj: any, parentTag?: string) => {
    if (!obj) return;

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === "function") {
        const routeDef = value();
        const fullPath = `${basePath}/${parentTag}/${routeDef.path}`;
        const swaggerPath = fullPath.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
        const method = (routeDef.method || "get").toLowerCase();

        const matchedRoute = findMatchingRoute(routeDef.path, method);
        if (!matchedRoute) return;

        const handlers = matchedRoute.handlers || [];
        const pathParams = Array.from(
          fullPath.matchAll(/:([a-zA-Z0-9_]+)/g),
        ).map((m) => m[1]);

        const parametersSection =
          pathParams.length > 0
            ? `parameters:\n${pathParams
              .map(
                (p) =>
                  ` *       - in: path\n *         name: ${p}\n *         required: true\n *         schema:\n *           type: string\n *         description: ${p}`,
              )
              .join("\n")}`
            : "";

        let requestBodySection = "";
        const validHandlers = handlers.filter(
          (h: any) => typeof h === "function",
        );

        for (const handler of validHandlers) {
          const name =
            handler.name ||
            Object.keys(verifyMiddleware || {}).find(
              (k) =>
                verifyMiddleware[k as keyof typeof verifyMiddleware] ===
                handler,
            ) ||
            "";

          if (!name || !joiSchemasMap[name]) continue;

          try {
            const swaggerSchema = getSwaggerSchemaFromJoi(joiSchemasMap[name]);
            if (swaggerSchema) {
              const isMultipart = multipartRoutes[name] === true;
              const contentType = isMultipart
                ? "multipart/form-data"
                : "application/json";

              // ⚡ MEMORY FIX 3: Compact JSON formatting
              const schemaYaml = JSON.stringify(swaggerSchema)
                .split("\n")
                .map((line) => ` *             ${line}`)
                .join("\n");

              requestBodySection = `\n *     requestBody:\n *       required: true\n *       content:\n *         ${contentType}:\n *           schema:\n${schemaYaml}`;
              break;
            }
          } catch (err) {
            console.error(`❌ Error generating schema for ${name}:`, err);
          }
        }

        // ⚡ MEMORY FIX 4: Write directly to stream
        writeStream.write(`
/**
 * @swagger
 * ${swaggerPath}:
 *   ${method}:
 *     summary: ${key}
 *     tags: [${parentTag || key}]
 *     ${parametersSection}
 *     ${requestBodySection}
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
`);
        routeCount++;
      } else if (typeof value === "object") {
        processObject(value, key);
      }
    });
  };

  processObject(urls);
  writeStream.end();

  logger(`\n✅ Generated Swagger comments for ${routeCount} route(s)`);
};

export const setupAutoSwagger = (app: Express) => {
  logger("\n🚀 Setting up Swagger auto-generation...");

  // ⚡ MEMORY FIX 5: Only generate if file doesn't exist or in dev mode
  if (!fs.existsSync(tempFile) || process.env.NODE_ENV === "development") {
    generateSwaggerComments();
    logger(`🟢 Swagger docs written to: ${tempFile}`);
  } else {
    logger(`♻️ Using cached Swagger docs from: ${tempFile}`);
  }

  const swaggerRoute = `/${getters.getAppSecrets().BASEPATH}/api-docs`;

  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: `${getters.getAppSecrets().APP_DESCRIPTION} API Documentation`,
        version: "1.0.0",
        description: "Auto-generated API documentation",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: [tempFile],
  };

  const swaggerSpec = swaggerJSDoc(options);

  // ⚡ MEMORY FIX 6: Clear cache after setup
  allRoutersCache = null;

  app.use(swaggerRoute, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(`${swaggerRoute}.json`, (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  const baseUrl = `http://${getters.getAppUrls().apiDocsUrl}`.replace(
    /\/+$/,
    "",
  );
  logger(`✅ Swagger UI  → ${baseUrl}${swaggerRoute}`);
  logger(`✅ Swagger JSON → ${baseUrl}${swaggerRoute}.json`);
};
