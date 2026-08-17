require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const requestLogger =
    require("./middleware/requestLogger");

const errorHandler =
    require("./middleware/errorHandler");

const asyncHandler =
    require("./utils/asyncHandler");

const userRoutes =
    require("./routes/userRoutes");

const profileRoutes =
    require("./routes/profileRoutes");

const app = express();

const PORT =
    process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ============================================================
// TEST ROUTE
// ============================================================

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message:
            "Weight Tracker backend is working"
    });
});

// ============================================================
// DATABASE HEALTH CHECK
// ============================================================

app.get(
    "/api/health",

    asyncHandler(async (req, res) => {
        await pool.query(
            "SELECT 1 AS database_test"
        );

        res.status(200).json({
            backend: "working",
            database: "connected"
        });
    })
);

// ============================================================
// API ROUTES
// ============================================================

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/profiles",
    profileRoutes
);

// ============================================================
// 404 ROUTE
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        error:
            "API route not found"
    });
});

// ============================================================
// ERROR HANDLER
// Must stay after all routes
// ============================================================

app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Weight Tracker server running at http://localhost:${PORT}`
        );

        console.log(
            `Health check: http://localhost:${PORT}/api/health`
        );
    }
);