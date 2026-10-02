const express = require("express");

const {
  createProductImageUpload,
  deleteProductImage,
} = require("../controllers/upload.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.post(
  "/products/presigned-url",
  authenticate,
  authorize("SELLER"),
  validate(schemas.uploadCreate),
  asyncHandler(createProductImageUpload),
);

router.delete(
  "/products/:productId/image",
  authenticate,
  authorize("SELLER"),
  validate(schemas.idParams("productId"), "params"),
  validate(schemas.uploadDelete),
  asyncHandler(deleteProductImage),
);

module.exports = router;
