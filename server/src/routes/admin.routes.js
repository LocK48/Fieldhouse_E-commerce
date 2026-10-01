const express = require("express");

const {
  getSellerApplications,
  approveSeller,
  rejectSeller,
  approveStore,
  suspendStore,
} = require("../controllers/admin.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/seller-applications", asyncHandler(getSellerApplications));

router.patch(
  "/seller-applications/:userId/approve",
  asyncHandler(approveSeller),
);

router.patch("/seller-applications/:userId/reject", asyncHandler(rejectSeller));

router.patch("/stores/:storeId/approve", asyncHandler(approveStore));

router.patch("/stores/:storeId/suspend", asyncHandler(suspendStore));

module.exports = router;
