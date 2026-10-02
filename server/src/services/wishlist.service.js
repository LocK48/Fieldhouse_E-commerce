const { Wishlist, Product } = require("../models");
const AppError = require("../utils/AppError");

const getWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate({
      path: "products",
      match: { status: "ACTIVE" },
      populate: [
        { path: "category", select: "name slug" },
        { path: "store", select: "name slug" },
      ],
    })
    .lean();
  return wishlist?.products || [];
};

const addProduct = async (userId, productId) => {
  const product = await Product.findOne({
    _id: productId,
    status: "ACTIVE",
  }).populate("store", "status");
  if (!product || product.store?.status !== "ACTIVE")
    throw new AppError("Product is not available", 404);
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true },
  );
  return getWishlist(userId);
};

const removeProduct = async (userId, productId) => {
  await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
  );
  return getWishlist(userId);
};

module.exports = { getWishlist, addProduct, removeProduct };
