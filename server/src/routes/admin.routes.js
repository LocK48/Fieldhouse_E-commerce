const express = require("express");

const {
  getSellerApplications,
  getPendingStores,
  approveSeller,
  rejectSeller,
  approveStore,
  suspendStore,
  getPendingProducts,
  getManageableOrders,
  advanceOrderStatus,
  approveProduct,
  rejectProduct,
} = require("../controllers/admin.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/seller-applications", asyncHandler(getSellerApplications));
router.get("/stores/pending", asyncHandler(getPendingStores));

router.patch(
  "/seller-applications/:userId/approve",
  asyncHandler(approveSeller),
);

router.patch("/seller-applications/:userId/reject", asyncHandler(rejectSeller));

router.patch("/stores/:storeId/approve", asyncHandler(approveStore));

router.patch("/stores/:storeId/suspend", asyncHandler(suspendStore));

router.get("/products/pending", asyncHandler(getPendingProducts));
router.get("/orders", asyncHandler(getManageableOrders));
router.patch("/orders/:orderId/advance", asyncHandler(advanceOrderStatus));

router.patch("/products/:productId/approve", asyncHandler(approveProduct));

router.patch("/products/:productId/reject", asyncHandler(rejectProduct));

module.exports = router;
