const express = require("express");

const {
  getMe,
  updateProfile,
  changePassword,
  applySeller,
} = require("../controllers/user.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/me", asyncHandler(getMe));

router.patch(
  "/me",
  validate(schemas.updateProfile),
  asyncHandler(updateProfile),
);

router.patch(
  "/me/password",
  validate(schemas.changePassword),
  asyncHandler(changePassword),
);

router.post(
  "/me/seller-application",
  validate(schemas.sellerApplication),
  asyncHandler(applySeller),
);

module.exports = router;
