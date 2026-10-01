const express = require("express");

const {
  getMe,
  updateProfile,
  changePassword,
  applySeller,
} = require("../controllers/user.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.get("/me", asyncHandler(getMe));

router.patch("/me", asyncHandler(updateProfile));

router.patch("/me/password", asyncHandler(changePassword));

router.post("/me/seller-application", asyncHandler(applySeller));

module.exports = router;
