const { isValidId } = require("../utils/numberUtils");

function requireUserOwnership(req, res, next) {
  const userId = Number(req.params.userId);
  if (!isValidId(userId)) return res.status(400).json({ error: "Invalid user ID" });
  if (userId !== Number(req.user?.userId)) {
    return res.status(403).json({ error: "You are not allowed to access this user's data" });
  }
  next();
}

module.exports = requireUserOwnership;
