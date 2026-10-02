const cartService = require("../services/cart.service");

const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  res.status(200).json({ success: true, data: { cart } });
};

const addItem = async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.body || {});
  res.status(200).json({ success: true, message: "Item added to cart", data: { cart } });
};

const updateItemQuantity = async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user._id, req.body || {});
  res.status(200).json({ success: true, message: "Cart updated", data: { cart } });
};

const removeItem = async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.body || {});
  res.status(200).json({ success: true, message: "Item removed from cart", data: { cart } });
};

const clearCart = async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  res.status(200).json({ success: true, message: "Cart cleared", data: { cart } });
};

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
