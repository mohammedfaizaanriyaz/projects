function validateEnv() {
  const requiredVariables = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
    "USDA_API_KEY"
  ];

  const missing = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const secret = process.env.JWT_SECRET;

  const isPlaceholder =
    /replace[_\s-]*with|change[_\s-]*me|your[_\s-]*(current[_\s-]*)?secret|placeholder/i.test(
      secret
    );

  const isRepeatedCharacter = /^(.)\1+$/u.test(secret);

  if (
    secret !== secret.trim() ||
    Buffer.byteLength(secret, "utf8") < 32 ||
    isPlaceholder ||
    isRepeatedCharacter
  ) {
    throw new Error(
      "JWT_SECRET must be a randomly generated secret of at least 32 bytes, without surrounding whitespace or placeholder text."
    );
  }
}

module.exports = validateEnv;