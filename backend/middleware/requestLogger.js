function requestLogger(req, res, next) {
    const startTime = Date.now();

    console.log(
        `[REQUEST] ${req.method} ${req.originalUrl}`
    );

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        console.log(
            `[RESPONSE] ${res.statusCode} ${req.method} ${req.originalUrl} - ${duration}ms`
        );
    });

    next();
}

module.exports = requestLogger;