const service = require("../services/wishlist.service");

const getWishlist = async (req, res) =>
  res.json({
    success: true,
    data: { products: await service.getWishlist(req.user._id) },
  });
const addProduct = async (req, res) =>
  res.json({
    success: true,
    data: {
      products: await service.addProduct(req.user._id, req.params.productId),
    },
  });
const removeProduct = async (req, res) =>
  res.json({
    success: true,
    data: {
      products: await service.removeProduct(req.user._id, req.params.productId),
    },
  });

module.exports = { getWishlist, addProduct, removeProduct };
