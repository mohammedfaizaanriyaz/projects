const express =
    require("express");

const {
    register,
    login,
    logout,
    getCurrentUser
} = require(
    "../controllers/authController"
);

const requireAuth =
    require(
        "../middleware/requireAuth"
    );


const router =
    express.Router();


// Register
router.post(
    "/register",
    register
);


// Login
router.post(
    "/login",
    login
);


// Logout
router.post(
    "/logout",
    logout
);


// Current logged-in user
router.get(
    "/me",
    requireAuth,
    getCurrentUser
);


module.exports =
    router;