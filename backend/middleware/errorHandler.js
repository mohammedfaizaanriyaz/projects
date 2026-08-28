const errorHandler = (error, req, res, next) => {
  console.error("\n======================================");
  console.error("SERVER ERROR");
  console.error("======================================");

  console.error("Method:", req.method);
  console.error("Route:", req.originalUrl);
  console.error("Error Code:", error.code || "UNKNOWN");
  console.error("Message:", error.message);

  if (process.env.NODE_ENV !== "production") {
    console.error("Stack:");
    console.error(error.stack);
  }

  console.error("======================================\n");

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
  });
};

module.exports = errorHandler;
