const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/address.controller");

const router = express.Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.getAddresses));
router.post("/", asyncHandler(controller.createAddress));
router.patch("/:addressId", asyncHandler(controller.updateAddress));
router.delete("/:addressId", asyncHandler(controller.deleteAddress));
module.exports = router;
