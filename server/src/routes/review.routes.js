const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/review.controller");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();
router.get(
  "/products/:productId",
  validate(schemas.idParams("productId"), "params"),
  validate(schemas.reviewQuery, "query"),
  asyncHandler(controller.getProductReviews),
);
router.post(
  "/",
  authenticate,
  validate(schemas.reviewCreate),
  asyncHandler(controller.createReview),
);
module.exports = router;
