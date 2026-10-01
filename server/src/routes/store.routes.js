const express = require("express");

const {
  createStore,
  getMyStore,
  updateMyStore,
} = require("../controllers/store.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("SELLER"), asyncHandler(createStore));

router.get("/me", authorize("SELLER"), asyncHandler(getMyStore));

router.patch("/me", authorize("SELLER"), asyncHandler(updateMyStore));

module.exports = router;
