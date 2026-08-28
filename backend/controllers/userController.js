const userService = require("../services/userService");

const { isValidId } = require("../utils/numberUtils");

// ============================================================
// CREATE USER
// ============================================================

const createUser = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    const userId = await userService.createUser(name.trim());

    res.status(201).json({
      message: "User created successfully",

      user_id: userId,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER
// ============================================================

const getUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);

    if (!isValidId(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUser,
};
