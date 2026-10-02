const { Order, Product, Review } = require("../models");
const AppError = require("../utils/AppError");

const getProductReviews = async (productId, { page = 1, limit = 20 } = {}) => {
  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number.parseInt(limit, 10) || 20, 1),
    50,
  );
  const filter = { product: productId, isPublished: true };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),
    Review.countDocuments(filter),
  ]);
  return {
    reviews,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const createReview = async (
  userId,
  { productId, orderId, rating, comment = "" },
) => {
  if (
    !Number.isInteger(Number(rating)) ||
    Number(rating) < 1 ||
    Number(rating) > 5
  )
    throw new AppError("Rating must be between 1 and 5", 400);
  if (typeof comment !== "string" || comment.trim().length > 2000)
    throw new AppError("Review comment is too long", 400);
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    orderStatus: "DELIVERED",
  }).select("items");
  if (
    !order ||
    !order.items.some((item) => item.product.toString() === String(productId))
  )
    throw new AppError(
      "A delivered order containing this product is required to review it",
      403,
    );
  if (await Review.exists({ user: userId, product: productId, order: orderId }))
    throw new AppError("You already reviewed this product for this order", 409);
  const product = await Product.findOne({ _id: productId, status: "ACTIVE" });
  if (!product) throw new AppError("Product not found", 404);
  const review = await Review.create({
    user: userId,
    product: productId,
    order: orderId,
    rating: Number(rating),
    comment: comment.trim(),
  });
  const [summary] = await Review.aggregate([
    { $match: { product: product._id, isPublished: true } },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  product.averageRating = summary?.average || 0;
  product.reviewCount = summary?.count || 0;
  await product.save();
  await review.populate("user", "name avatar");
  return review;
};

const deleteReview = async (userId, reviewId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
  if (!review) throw new AppError("Review not found", 404);
  const [summary] = await Review.aggregate([
    { $match: { product: review.product, isPublished: true } },
    { $group: { _id: "$product", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: review.product },
    { $set: { averageRating: summary?.average || 0, reviewCount: summary?.count || 0 } },
  );
};

module.exports = { getProductReviews, createReview, deleteReview };
