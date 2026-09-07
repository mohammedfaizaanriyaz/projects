const userService =
    require(
        "../services/userService"
    );

const authService =
    require(
        "../services/authService"
    );


// ============================================================
// COOKIE OPTIONS
// ============================================================

const getCookieOptions = () => ({
    httpOnly: true,

    secure:
        process.env.NODE_ENV ===
        "production",

    sameSite: "lax",

    maxAge:
        7 *
        24 *
        60 *
        60 *
        1000
});


// ============================================================
// REGISTER
// ============================================================

const register = async (
    req,
    res,
    next
) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (
            !name ||
            !String(name).trim()
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Name is required"
                });
        }

        if (
            !email ||
            typeof email !==
            "string"
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Email is required"
                });
        }

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(
                normalizedEmail
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Enter a valid email address"
                });
        }

        if (
            typeof password !==
            "string" ||
            password.length < 8
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Password must contain at least 8 characters"
                });
        }

        if (
            Buffer.byteLength(
                password,
                "utf8"
            ) > 72
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Password is too long"
                });
        }

        const existingUser =
            await userService
                .findUserByEmail(
                    normalizedEmail
                );

        if (existingUser) {
            return res
                .status(409)
                .json({
                    error:
                        "An account with this email already exists"
                });
        }

        const passwordHash =
            await authService
                .hashPassword(
                    password
                );

        const userId =
            await userService
                .createAccount({
                    name:
                        String(name)
                            .trim(),

                    email:
                        normalizedEmail,

                    passwordHash
                });

        const token =
            authService
                .createToken(
                    userId
                );

        res.cookie(
            "auth_token",
            token,
            getCookieOptions()
        );

        return res
            .status(201)
            .json({
                message:
                    "Account created successfully",

                user: {
                    user_id:
                        userId,

                    name:
                        String(name)
                            .trim(),

                    email:
                        normalizedEmail
                }
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// LOGIN
// ============================================================

const login = async (
    req,
    res,
    next
) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (
            !email ||
            !password
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Email and password are required"
                });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const user =
            await userService
                .findUserByEmail(
                    normalizedEmail
                );

        if (
            !user ||
            !user.password_hash
        ) {
            return res
                .status(401)
                .json({
                    error:
                        "Invalid email or password"
                });
        }

        const passwordMatches =
            await authService
                .comparePassword(
                    String(password),
                    user.password_hash
                );

        if (!passwordMatches) {
            return res
                .status(401)
                .json({
                    error:
                        "Invalid email or password"
                });
        }

        const token =
            authService
                .createToken(
                    Number(
                        user.user_id
                    )
                );

        res.cookie(
            "auth_token",
            token,
            getCookieOptions()
        );

        return res
            .status(200)
            .json({
                message:
                    "Login successful",

                user: {
                    user_id:
                        Number(
                            user.user_id
                        ),

                    name:
                        user.name,

                    email:
                        user.email
                }
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// LOGOUT
// ============================================================

const logout = (
    req,
    res
) => {
    res.clearCookie(
        "auth_token",
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "lax"
        }
    );

    return res
        .status(200)
        .json({
            message:
                "Logged out successfully"
        });
};


// ============================================================
// CURRENT USER
// ============================================================

const getCurrentUser = async (
    req,
    res,
    next
) => {
    try {
        const user =
            await userService
                .findUserById(
                    req.user.userId
                );

        return res
            .status(200)
            .json({
                user: {
                    user_id:
                        Number(
                            user.user_id
                        ),

                    name:
                        user.name,

                    email:
                        user.email
                }
            });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};