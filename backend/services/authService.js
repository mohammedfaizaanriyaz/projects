const bcrypt =
    require("bcryptjs");

const jwt =
    require("jsonwebtoken");


// ============================================================
// HASH PASSWORD
// ============================================================

const hashPassword = async (
    password
) => {
    return bcrypt.hash(
        password,
        12
    );
};


// ============================================================
// COMPARE PASSWORD
// ============================================================

const comparePassword = async (
    password,
    passwordHash
) => {
    return bcrypt.compare(
        password,
        passwordHash
    );
};


// ============================================================
// CREATE LOGIN TOKEN
// ============================================================

const createToken = (
    userId
) => {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is not configured"
        );
    }

    return jwt.sign(
        {
            userId
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "7d", algorithm: "HS256"
        }
    );
};


// ============================================================
// VERIFY LOGIN TOKEN
// ============================================================

const verifyToken = (
    token
) => {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is not configured"
        );
    }

    return jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ["HS256"] }
    );
};


module.exports = {
    hashPassword,
    comparePassword,
    createToken,
    verifyToken
};