const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/wishlist.controller");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.getWishlist));
router.put("/:productId", asyncHandler(controller.addProduct));
router.delete("/:productId", asyncHandler(controller.removeProduct));
module.exports = router;
