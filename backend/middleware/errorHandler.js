const DEFAULT_MESSAGES = {
    400: "Invalid request",
    401: "Authentication required",
    403: "Access denied",
    404: "Resource not found",
    413: "Request body is too large",
    415: "Unsupported request format",
    429: "Too many requests. Please try again later.",
    502: "Nutrition provider is unavailable. Please try again later.",
    503: "Service temporarily unavailable",
    504: "Nutrition provider timed out. Please try again."
};

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const status = [error?.statusCode, error?.status].find(
        (value) =>
            Number.isInteger(value) &&
            value >= 400 &&
            value <= 599
    ) ?? 500;

    let message =
        DEFAULT_MESSAGES[status] ||
        (
            status < 500
                ? "Request could not be processed"
                : "Internal server error"
        );

    if (status === 400 && error?.type === "entity.parse.failed") {
        message = "Request body contains invalid JSON";
    } else if (status === 413) {
        message = DEFAULT_MESSAGES[413];
    } else if (
        error?.expose === true &&
        typeof error.message === "string" &&
        error.message.trim()
    ) {
        message = error.message;
    }

    if (status >= 500) {
        // Driver messages/stacks can contain SQL parameters. Log codes and a
        // request ID, never query text, credentials, health data or cookies.
        console.error(JSON.stringify({
            event: "server_error", requestId: req.requestId,
            method: req.method, path: req.path, status,
            type: error?.name, code: error?.code, sqlState: error?.sqlState
        }));
    }

    return res.status(status).json({ error: message, requestId: req.requestId });
};

module.exports = errorHandler;