const userService =
    require("../services/userService");

const {
    isValidId
} = require(
    "../utils/numberUtils"
);



// ============================================================
// GET USER
// ============================================================

const getUser = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            Number(
                req.params.userId
            );

        if (!isValidId(userId)) {
            return res.status(400).json({
                error:
                    "Invalid user ID"
            });
        }

        const user =
            await userService.findUserById(
                userId
            );

        if (!user) {
            return res.status(404).json({
                error:
                    "User not found"
            });
        }

        res.status(200).json(
            user
        );

    } catch (error) {
        next(error);
    }
};

module.exports = {
    
    getUser
};