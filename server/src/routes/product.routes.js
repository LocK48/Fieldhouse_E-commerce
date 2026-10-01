const express = require("express");

const {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(getProducts));

router.get("/:id", asyncHandler(getProduct));

router.get(
  "/seller/me",
  authenticate,
  authorize("SELLER"),
  asyncHandler(getMyProducts),
);

router.post(
  "/",
  authenticate,
  authorize("SELLER"),
  asyncHandler(createProduct),
);

router.patch(
  "/:id",
  authenticate,
  authorize("SELLER"),
  asyncHandler(updateProduct),
);

router.delete(
  "/:id",
  authenticate,
  authorize("SELLER"),
  asyncHandler(deleteProduct),
);

module.exports = router;
