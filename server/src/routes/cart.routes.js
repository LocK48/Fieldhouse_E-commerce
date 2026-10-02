const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} = require("../controllers/cart.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(getCart));
router.post("/items", asyncHandler(addItem));
router.patch("/items", asyncHandler(updateItemQuantity));
router.delete("/items", asyncHandler(removeItem));
router.delete("/", asyncHandler(clearCart));

module.exports = router;
