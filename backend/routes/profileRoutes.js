const express = require("express");
const requireAuth =
    require(
        "../middleware/requireAuth"
    );

const requireProfileOwnership =
    require(
        "../middleware/requireProfileOwnership"
    );

const {
    getProfile,
    updateProfile,
    deleteProfile
} = require("../controllers/profileController");

const weightRoutes =
    require("./weightRoutes");

const router = express.Router();
router.use(
    "/:profileId",
    requireAuth,
    requireProfileOwnership
);

// Weight routes belonging to a profile
router.use(
    "/:profileId/weight-records",
    weightRoutes
);

// Get one profile
router.get(
    "/:profileId",
    getProfile
);

// Update profile
router.put(
    "/:profileId",
    updateProfile
);

// Delete profile
router.delete(
    "/:profileId",
    deleteProfile
);

module.exports = router;