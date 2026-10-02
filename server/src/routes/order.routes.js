const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  createCodOrder,
  getMyOrders,
  getMyOrder,
} = require("../controllers/order.controller");

const router = express.Router();
router.use(authenticate);

router.post("/", asyncHandler(createCodOrder));
router.get("/", asyncHandler(getMyOrders));
router.get("/:id", asyncHandler(getMyOrder));

module.exports = router;
