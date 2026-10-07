const authService =
    require(
        "../services/authService"
    );

const userService =
    require(
        "../services/userService"
    );


// ============================================================
// REQUIRE AUTHENTICATED USER
// ============================================================

const requireAuth = async (
    req,
    res,
    next
) => {
    try {
        const token =
            req.cookies
                ?.auth_token;

        if (!token) {
            return res
                .status(401)
                .json({
                    error:
                        "Authentication required"
                });
        }

        let decoded;

        try {
            decoded =
                authService
                    .verifyToken(
                        token
                    );
        } catch {
            return res
                .status(401)
                .json({
                    error:
                        "Invalid or expired session"
                });
        }

        if (!Number.isSafeInteger(decoded.userId) || decoded.userId < 1) {
            return res.status(401).json({ error: "Invalid session" });
        }

        const user =
            await userService
                .findUserById(
                    Number(
                        decoded.userId
                    )
                );

        if (!user) {
            return res
                .status(401)
                .json({
                    error:
                        "User no longer exists"
                });
        }

        req.user = {
            userId:
                Number(
                    user.user_id
                ),

            name:
                user.name
        };

        next();

    } catch (error) {
        next(error);
    }
};


module.exports =
    requireAuth;