const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/review.controller");

const router = express.Router();
router.get("/products/:productId", asyncHandler(controller.getProductReviews));
router.post("/", authenticate, asyncHandler(controller.createReview));
module.exports = router;
