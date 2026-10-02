const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/wishlist.controller");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.getWishlist));
router.put(
  "/:productId",
  validate(schemas.idParams("productId"), "params"),
  asyncHandler(controller.addProduct),
);
router.delete(
  "/:productId",
  validate(schemas.idParams("productId"), "params"),
  asyncHandler(controller.removeProduct),
);
module.exports = router;
