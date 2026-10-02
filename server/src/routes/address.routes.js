const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/address.controller");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.getAddresses));
router.post(
  "/",
  validate(schemas.addressBody),
  asyncHandler(controller.createAddress),
);
router.patch(
  "/:addressId",
  validate(schemas.idParams("addressId"), "params"),
  validate(schemas.addressPatch),
  asyncHandler(controller.updateAddress),
);
router.delete(
  "/:addressId",
  validate(schemas.idParams("addressId"), "params"),
  asyncHandler(controller.deleteAddress),
);
module.exports = router;
