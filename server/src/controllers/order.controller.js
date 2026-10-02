const orderService = require("../services/order.service");

const createCodOrder = async (req, res) => {
  const order = await orderService.createCodOrder(req.user._id, req.body?.shippingAddress);
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

module.exports = { createCodOrder, getMyOrders, getMyOrder };
