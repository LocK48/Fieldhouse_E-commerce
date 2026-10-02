const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");
const {
  createCodOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
} = require("../controllers/order.controller");

const router = express.Router();
router.use(authenticate);

router.post("/", validate(schemas.orderCreate), asyncHandler(createCodOrder));

router.get(
  "/",
  validate(schemas.orderQuery, "query"),
  asyncHandler(getMyOrders),
);

router.patch(
  "/:id/cancel",
  validate(schemas.idParams("id"), "params"),
  asyncHandler(cancelMyOrder),
);

router.get(
  "/:id",
  validate(schemas.idParams("id"), "params"),
  asyncHandler(getMyOrder),
);

module.exports = router;
