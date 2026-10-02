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
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/seller-applications", asyncHandler(getSellerApplications));
router.get("/stores/pending", asyncHandler(getPendingStores));

router.patch(
  "/seller-applications/:userId/approve",
  validate(schemas.idParams("userId"), "params"),
  asyncHandler(approveSeller),
);

router.patch(
  "/seller-applications/:userId/reject",
  validate(schemas.idParams("userId"), "params"),
  validate(schemas.sellerApplicationRejection),
  asyncHandler(rejectSeller),
);

router.patch(
  "/stores/:storeId/approve",
  validate(schemas.idParams("storeId"), "params"),
  asyncHandler(approveStore),
);

router.patch(
  "/stores/:storeId/suspend",
  validate(schemas.idParams("storeId"), "params"),
  asyncHandler(suspendStore),
);

router.get("/products/pending", asyncHandler(getPendingProducts));
router.get("/orders", asyncHandler(getManageableOrders));
router.patch(
  "/orders/:orderId/advance",
  validate(schemas.idParams("orderId"), "params"),
  asyncHandler(advanceOrderStatus),
);

router.patch(
  "/products/:productId/approve",
  validate(schemas.idParams("productId"), "params"),
  asyncHandler(approveProduct),
);

router.patch(
  "/products/:productId/reject",
  validate(schemas.idParams("productId"), "params"),
  asyncHandler(rejectProduct),
);

module.exports = router;
