const { verifyAccessToken } = require("../utils/jwt");

const AppError = require("../utils/AppError");

const { User } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new AppError("User is not available", 401);
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid access token", 401));
    }

    if (error.name === "TokenExpiredError") {
      return next(new AppError("Access token expired", 401));
    }

    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
