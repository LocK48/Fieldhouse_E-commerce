const { User, Store } = require("../models");

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

module.exports = {
  getSellerApplications,
  approveSeller,
  rejectSeller,
  approveStore,
  suspendStore,
};
