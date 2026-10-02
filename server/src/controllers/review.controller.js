const service = require("../services/review.service");
const getProductReviews = async (req, res) =>
  res.json({
    success: true,
    data: await service.getProductReviews(req.params.productId, req.query),
  });
const createReview = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      data: { review: await service.createReview(req.user._id, req.body) },
    });
const deleteReview = async (req, res) => {
  await service.deleteReview(req.user._id, req.params.reviewId);
  res.json({ success: true, message: "Review deleted" });
};
module.exports = { getProductReviews, createReview, deleteReview };
