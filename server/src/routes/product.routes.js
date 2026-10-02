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
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.get(
  "/",
  validate(schemas.productQuery, "query"),
  asyncHandler(getProducts),
);

router.get(
  "/:id",
  validate(schemas.idParams("id"), "params"),
  asyncHandler(getProduct),
);

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
  validate(schemas.productBody),
  asyncHandler(createProduct),
);

router.patch(
  "/:id",
  authenticate,
  authorize("SELLER"),
  validate(schemas.idParams("id"), "params"),
  validate(schemas.productPatch),
  asyncHandler(updateProduct),
);

router.delete(
  "/:id",
  authenticate,
  authorize("SELLER"),
  validate(schemas.idParams("id"), "params"),
  asyncHandler(deleteProduct),
);

module.exports = router;
