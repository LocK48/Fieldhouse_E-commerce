const orderService = require("../services/order.service");

const createCodOrder = async (req, res) => {
  const order = await orderService.createCodOrder(
    req.user._id,
    req.body?.shippingAddress,
  );
  res.status(201).json({
    success: true,
    message: "Cash-on-delivery order created",
    data: { order },
  });
};

const getMyOrders = async (req, res) => {
  const result = await orderService.getMyOrders(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
};

const getMyOrder = async (req, res) => {
  const order = await orderService.getMyOrderById(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: { order } });
};

const cancelMyOrder = async (req, res) => {
  const order = await orderService.cancelMyOrder(req.user._id, req.params.id);
  res
    .status(200)
    .json({ success: true, message: "Order cancelled", data: { order } });
};

const getSellerOrders = async (req, res) => {
  const orders = await orderService.getSellerOrders(req.user._id);
  res.status(200).json({ success: true, data: { orders } });
};

const confirmSellerPayment = async (req, res) => {
  const order = await orderService.confirmSellerPayment(
    req.user._id,
    req.params.id,
  );
  res.status(200).json({
    success: true,
    message: "Seller payment confirmation saved",
    data: { order },
  });
};

module.exports = {
  createCodOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
  getSellerOrders,
  confirmSellerPayment,
};
