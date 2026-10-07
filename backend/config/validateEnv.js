function integer(env, name, fallback, min, max) {
  const value = env[name] ?? String(fallback);
  if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return Number(value);
}

function validateEnv(env = process.env) {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET", "USDA_API_KEY"];
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  const secret = env.JWT_SECRET;
  if (secret !== secret.trim() || Buffer.byteLength(secret) < 32 || /^(.)\1+$/u.test(secret) ||
      /replace[_\s-]*with|change[_\s-]*me|your[_\s-]*(current[_\s-]*)?secret|placeholder/i.test(secret)) {
    throw new Error("JWT_SECRET must be a randomly generated secret of at least 32 bytes, without surrounding whitespace or placeholder text.");
  }
  if (!["development", "test", "production"].includes(env.NODE_ENV || "development")) {
    throw new Error("NODE_ENV must be development, test, or production");
  }
  const production = env.NODE_ENV === "production";
  if (production && !env.FRONTEND_ORIGIN) throw new Error("FRONTEND_ORIGIN is required in production (the public HTTPS origin)");
  let origin;
  try {
    const url = new URL(env.FRONTEND_ORIGIN || "http://localhost:5173");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash || (production && url.protocol !== "https:")) throw new Error();
    origin = url.origin;
  } catch {
    throw new Error("FRONTEND_ORIGIN must be a single origin without a path; production requires HTTPS");
  }
  if (env.DB_SSL && !["true", "false"].includes(env.DB_SSL)) throw new Error("DB_SSL must be true or false");
  if (env.DB_SSL_CA && env.DB_SSL !== "true") throw new Error("DB_SSL_CA requires DB_SSL=true");
  return {
    production, origin,
    port: integer(env, "PORT", 5000, 1, 65535),
    trustProxy: integer(env, "TRUST_PROXY_HOPS", 0, 0, 10),
    dbPort: integer(env, "DB_PORT", 3306, 1, 65535),
    dbConnectionLimit: integer(env, "DB_CONNECTION_LIMIT", 5, 1, 100),
  };
}

module.exports = validateEnv;
