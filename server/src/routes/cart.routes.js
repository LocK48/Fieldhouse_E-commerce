const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");
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

router.post("/items", validate(schemas.cartAdd), asyncHandler(addItem));

router.patch(
  "/items",
  validate(schemas.cartUpdate),
  asyncHandler(updateItemQuantity),
);

router.delete("/items", validate(schemas.cartRemove), asyncHandler(removeItem));

router.delete("/", asyncHandler(clearCart));

module.exports = router;
