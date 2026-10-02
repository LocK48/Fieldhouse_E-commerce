const express = require("express");

const {
  createStore,
  getMyStore,
  getPublicStore,
  updateMyStore,
} = require("../controllers/store.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.get("/slug/:slug", asyncHandler(getPublicStore));

router.use(authenticate);

router.post(
  "/",
  authorize("SELLER"),
  validate(schemas.storeCreate),
  asyncHandler(createStore),
);

router.get("/me", authorize("SELLER"), asyncHandler(getMyStore));

router.patch(
  "/me",
  authorize("SELLER"),
  validate(schemas.storePatch),
  asyncHandler(updateMyStore),
);

module.exports = router;
