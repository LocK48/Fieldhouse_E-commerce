const { Store, User, Product } = require("../models");

const AppError = require("../utils/AppError");

const createStore = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "SELLER") {
    throw new AppError("Only approved sellers can create a store", 403);
  }

  if (user.sellerStatus !== "APPROVED") {
    throw new AppError("Seller account is not approved", 403);
  }

  const existingStore = await Store.findOne({
    owner: userId,
  });

  if (existingStore) {
    throw new AppError("Seller already owns a store", 409);
  }

  const existingSlug = await Store.findOne({
    slug: data.slug,
  });

  if (existingSlug) {
    throw new AppError("Store slug already exists", 409);
  }

  const store = await Store.create({
    owner: userId,
    name: data.name,
    slug: data.slug,
    description: data.description || "",
    logo: data.logo || null,
    banner: data.banner || null,
    status: "PENDING",
  });

  return store;
};

const getMyStore = async (userId) => {
  const store = await Store.findOne({
    owner: userId,
  });

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return store;
};

const getPublicStore = async (slug) => {
  const store = await Store.findOne({ slug, status: "ACTIVE" })
    .populate("owner", "name avatar")
    .lean();
  if (!store) throw new AppError("Store not found", 404);
  const products = await Product.find({ store: store._id, status: "ACTIVE" })
    .populate("category", "name slug")
    .lean({ virtuals: true });
  return { store, products };
};

const updateMyStore = async (userId, data) => {
  const store = await Store.findOne({
    owner: userId,
  });

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const allowedFields = ["name", "description", "logo", "banner"];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      store[field] = data[field];
    }
  }

  await store.save();

  return store;
};

module.exports = {
  createStore,
  getMyStore,
  getPublicStore,
  updateMyStore,
};
