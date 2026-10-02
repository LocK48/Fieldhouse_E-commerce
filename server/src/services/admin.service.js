const { User, Store, Product, Order, Payment } = require("../models");

const AppError = require("../utils/AppError");

const getSellerApplications = async () => {
  return User.find({
    sellerStatus: "PENDING",
  })
    .select("name email sellerStatus sellerApplication createdAt")
    .sort({
      createdAt: -1,
    });
};

const getPendingStores = async () =>
  Store.find({ status: "PENDING" })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

const approveSeller = async (adminId, userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.sellerStatus !== "PENDING") {
    throw new AppError("Seller application is not pending", 400);
  }

  user.role = "SELLER";
  user.sellerStatus = "APPROVED";

  user.sellerApplication.reviewedAt = new Date();

  user.sellerApplication.reviewedBy = adminId;

  user.sellerApplication.rejectionReason = null;

  await user.save();

  return user;
};

const rejectSeller = async (adminId, userId, rejectionReason) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.sellerStatus !== "PENDING") {
    throw new AppError("Seller application is not pending", 400);
  }

  user.sellerStatus = "REJECTED";

  user.sellerApplication.reviewedAt = new Date();

  user.sellerApplication.reviewedBy = adminId;

  user.sellerApplication.rejectionReason = rejectionReason;

  await user.save();

  return user;
};

const approveStore = async (storeId) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  if (store.status !== "PENDING") {
    throw new AppError("Store is not pending", 400);
  }

  store.status = "ACTIVE";

  await store.save();

  return store;
};

const suspendStore = async (storeId) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  store.status = "SUSPENDED";

  await store.save();

  return store;
};

const getPendingProducts = async () => {
  return Product.find({
    status: "PENDING",
  })
    .populate("store", "name slug")
    .populate("category", "name slug")
    .sort({
      createdAt: -1,
    });
};

const getManageableOrders = async () => Order.find({
  orderStatus: { $in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] },
})
  .populate("user", "name email")
  .sort({ createdAt: -1 })
  .limit(100)
  .lean();

const advanceOrderStatus = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  const nextStatus = {
    PENDING: "CONFIRMED",
    CONFIRMED: "PROCESSING",
    PROCESSING: "SHIPPED",
    SHIPPED: "DELIVERED",
  }[order.orderStatus];
  if (!nextStatus) throw new AppError("Order cannot move to another status", 400);
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus },
    {
      $set: {
        orderStatus: nextStatus,
        ...(nextStatus === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
      },
    },
    { new: true, runValidators: true },
  );
  if (!updatedOrder) throw new AppError("Order status changed; refresh and retry", 409);
  if (nextStatus === "DELIVERED") {
    await Payment.updateOne({ order: order._id }, { $set: { status: "SUCCEEDED", paidAt: new Date() } });
  }
  return updatedOrder;
};

const approveProduct = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.status !== "PENDING") {
    throw new AppError("Product is not pending", 400);
  }

  product.status = "ACTIVE";

  await product.save();

  return product;
};

const rejectProduct = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.status = "REJECTED";

  await product.save();

  return product;
};

module.exports = {
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
};
