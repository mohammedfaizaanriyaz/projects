const userService = require("../services/userService");
const authService = require("../services/authService");

const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
});
const publicUser = (user) => ({ user_id: Number(user.user_id), name: user.name, email: user.email });

function credentials(body, registering) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Request body must be an object";
  const { name, email, password } = body;
  if (registering && (typeof name !== "string" || !name.trim() || Array.from(name.trim()).length > 100)) {
    return "Name must contain 1 to 100 characters";
  }
  if (typeof email !== "string" || Array.from(email.trim()).length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address of at most 255 characters";
  }
  if (typeof password !== "string" || password.length < (registering ? 8 : 1) || Buffer.byteLength(password, "utf8") > 72) {
    return registering ? "Password must contain at least 8 characters and at most 72 UTF-8 bytes" : "Invalid email or password";
  }
  return null;
}

function setSession(res, userId) {
  res.cookie("auth_token", authService.createToken(userId), {
    ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function register(req, res, next) {
  try {
    const problem = credentials(req.body, true);
    if (problem) return res.status(400).json({ error: problem });
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    if (await userService.findUserByEmail(email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const passwordHash = await authService.hashPassword(req.body.password);
    const userId = await userService.createAccount({ name, email, passwordHash });
    setSession(res, userId);
    return res.status(201).json({ message: "Account created successfully", user: { user_id: userId, name, email } });
  } catch (error) {
    // The database unique key handles concurrent registrations of the same email.
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "An account with this email already exists" });
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const problem = credentials(req.body, false);
    if (problem) return res.status(400).json({ error: problem });
    const user = await userService.findUserByEmail(req.body.email.trim().toLowerCase());
    if (!user?.password_hash || !(await authService.comparePassword(req.body.password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    setSession(res, Number(user.user_id));
    return res.json({ message: "Login successful", user: publicUser(user) });
  } catch (error) { next(error); }
}

function logout(_req, res) {
  res.clearCookie("auth_token", cookieOptions());
  return res.json({ message: "Logged out successfully" });
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await userService.findUserById(req.user.userId);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    return res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
}

module.exports = { register, login, logout, getCurrentUser };
