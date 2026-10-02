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
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.post(
  "/register",
  validate(schemas.authRegister),
  asyncHandler(register),
);

router.post("/login", validate(schemas.authLogin), asyncHandler(login));

router.post("/refresh", validate(schemas.refreshToken), asyncHandler(refresh));

router.post("/logout", validate(schemas.refreshToken), asyncHandler(logout));

router.get("/me", authenticate, asyncHandler(getMe));

module.exports = router;
