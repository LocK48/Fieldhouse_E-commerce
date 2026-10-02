const express = require("express");

const {
  createProductImageUpload,
  deleteProductImage,
} = require("../controllers/upload.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/products/presigned-url",
  authenticate,
  authorize("SELLER"),
  asyncHandler(createProductImageUpload),
);

router.delete(
  "/products/:productId/image",
  authenticate,
  authorize("SELLER"),
  asyncHandler(deleteProductImage),
);

module.exports = router;
