const express = require("express");

const {
  register,
  login,
  refresh,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(register));

router.post("/login", asyncHandler(login));

router.post("/refresh", asyncHandler(refresh));

router.post("/logout", asyncHandler(logout));

router.get("/me", authenticate, asyncHandler(getMe));

module.exports = router;
