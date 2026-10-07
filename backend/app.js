const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("node:path");
const fs = require("node:fs");
const validateEnv = require("./config/validateEnv");
const pool = require("./db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { checkDatabase } = require("./config/checkDatabase");

function limiter(limit, windowMs) {
  return rateLimit({ limit, windowMs, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." } });
}

function createApp({ config = validateEnv(), database = pool, logRequests = true, dist = path.resolve(__dirname, "../frontend/dist") } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "upgrade-insecure-requests": config.production ? [] : null,
    } },
    strictTransportSecurity: config.production ? undefined : false,
  }));
  if (logRequests) app.use(requestLogger);
  app.use("/api", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === config.origin) return callback(null, true);
      return callback(Object.assign(new Error("Origin is not allowed"), { statusCode: 403, expose: true }));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Vyra-Request"],
  }));
  // Custom headers force browser writes through CORS; validate Origin as well.
  app.use("/api", (req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("X-Vyra-Request") !== "1") {
      return res.status(403).json({ error: "Missing request protection header" });
    }
    next();
  });
  app.use("/api", limiter(600, 5 * 60 * 1000));
  app.use(express.json({ limit: "100kb", strict: true }));
  app.use(cookieParser());
  app.get("/api/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/health", async (_req, res) => {
    try {
      await checkDatabase(database);
      res.json({ backend: "working", database: "connected", schema: "ready" });
    } catch {
      res.status(503).json({ error: "Database is unavailable or requires manual schema preparation" });
    }
  });
  app.post("/api/auth/login", limiter(20, 15 * 60 * 1000));
  app.post("/api/auth/register", limiter(5, 60 * 60 * 1000));
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/users", require("./routes/userRoutes"));
  app.use("/api/profiles", require("./routes/profileRoutes"));
  app.use("/api/nutrition", limiter(60, 60 * 1000), require("./routes/nutritionRoutes"));
  app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
  if (fs.existsSync(path.join(dist, "index.html"))) {
    app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
    app.use(express.static(dist, { maxAge: 0, index: false }));
    app.get("/", (_req, res) => {
      res.set("Cache-Control", "no-cache");
      res.sendFile(path.join(dist, "index.html"));
    });
  } else if (config.production) {
    throw new Error("Frontend build missing. Run npm run build before starting production.");
  }
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
