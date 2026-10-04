const mongoose = require("mongoose");
const { Cart, Order, Payment, Product, Store, Review } = require("../models");
const AppError = require("../utils/AppError");

const FREE_SHIPPING_THRESHOLD = 1_500_000;
const STANDARD_SHIPPING_FEE = 30_000;

const requiredText = (value, field, maxLength) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} is required`, 400);
  }
  const cleaned = value.trim();
  if (cleaned.length > maxLength) {
    throw new AppError(
      `${field} must be ${maxLength} characters or fewer`,
      400,
    );
  }
  return cleaned;
};

const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw new AppError("Shipping address is required", 400);
  }

  const phone = requiredText(address.phone, "Phone", 30);
  if (!/^[0-9+()\s.-]{8,30}$/.test(phone)) {
    throw new AppError("Phone number is invalid", 400);
  }

  return {
    recipientName: requiredText(address.recipientName, "Recipient name", 100),
    phone,
    addressLine: requiredText(address.addressLine, "Street address", 250),
    ward: requiredText(address.ward, "Ward", 100),
    district: requiredText(address.district, "District", 100),
    city: requiredText(address.city, "City or province", 100),
    country:
      typeof address.country === "string" && address.country.trim()
        ? address.country.trim().slice(0, 100)
        : "Vietnam",
  };
};

const createCodOrder = async (userId, shippingAddressInput) => {
  const shippingAddress = validateShippingAddress(shippingAddressInput);
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      createdOrder = null;
      const cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new AppError("Your cart is empty", 400);
      }

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.product,
          status: "ACTIVE",
        }).session(session);
        if (!product) {
          throw new AppError(
            "A product in your cart is no longer available",
            409,
          );
        }

        const store = await Store.findOne({
          _id: product.store,
          status: "ACTIVE",
        })
          .select("_id")
          .session(session);
        if (!store) {
          throw new AppError(
            "A store in your cart is no longer available",
            409,
          );
        }

        const variant = product.variants.id(cartItem.variantId);
        if (!variant || !variant.isActive) {
          throw new AppError(`${product.name} has an unavailable variant`, 409);
        }

        const quantity = cartItem.quantity;
        if (variant.stock < quantity) {
          throw new AppError(`Not enough stock for ${product.name}`, 409);
        }

        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            status: "ACTIVE",
            variants: {
              $elemMatch: {
                _id: variant._id,
                isActive: true,
                stock: { $gte: quantity },
              },
            },
          },
          { $inc: { "variants.$.stock": -quantity } },
          { session },
        );
        if (stockUpdate.modifiedCount !== 1) {
          throw new AppError(`Not enough stock for ${product.name}`, 409);
        }

        const lineSubtotal = variant.price * quantity;
        subtotal += lineSubtotal;
        orderItems.push({
          product: product._id,
          variantId: variant._id,
          store: store._id,
          name: product.name,
          sku: variant.sku,
          price: variant.price,
          quantity,
          subtotal: lineSubtotal,
          variant: {
            name: variant.name || null,
            sku: variant.sku,
            attributes: variant.attributes?.toObject?.() || {},
          },
        });
      }

      const shippingFee =
        subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const [order] = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingFee,
            discount: 0,
            total: subtotal + shippingFee,
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
          },
        ],
        { session },
      );

      await Payment.create(
        [
          {
            order: order._id,
            user: userId,
            provider: "COD",
            amount: order.total,
            currency: "VND",
            status: "PENDING",
          },
        ],
        { session },
      );

      cart.items = [];
      cart.subtotal = 0;
      await cart.save({ session });
      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  return createdOrder;
};

const getMyOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);
  const pageNumber = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const limitNumber = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 50)
    : 10;
  const filter = { user: userId };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const existingReviews = orders.length ? await Review.find({ user: userId, order: { $in: orders.map((order) => order._id) } }).select("_id order product").lean() : [];
  const reviewsByOrder = new Map();
  for (const review of existingReviews) {
    const orderId = review.order.toString();
    if (!reviewsByOrder.has(orderId)) reviewsByOrder.set(orderId, {});
    reviewsByOrder.get(orderId)[review.product.toString()] = review._id.toString();
  }

  return {
    orders: orders.map((order) => {
      const reviewIdsByProduct = reviewsByOrder.get(order._id.toString()) || {};
      return { ...order, reviewIdsByProduct, reviewedProductIds: Object.keys(reviewIdsByProduct) };
    }),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      hasNextPage: pageNumber < Math.ceil(total / limitNumber),
      hasPreviousPage: pageNumber > 1,
    },
  };
};

const getSellerOrders = async (userId) => {
  const store = await Store.findOne({ owner: userId }).select("_id name").lean();
  if (!store) throw new AppError("Store not found", 404);
  const orders = await Order.find({ "items.store": store._id })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return orders.map((order) => {
    const sellerItems = order.items.filter(
      (item) => String(item.store) === String(store._id),
    );
    const sellerOrder = { ...order };
    delete sellerOrder.total;
    delete sellerOrder.subtotal;
    delete sellerOrder.shippingFee;
    delete sellerOrder.discount;
    return {
      ...sellerOrder,
      items: sellerItems,
      sellerSubtotal: sellerItems.reduce((sum, item) => sum + item.subtotal, 0),
      sellerPaymentConfirmed: (order.paidStores || []).some(
        (paidStore) => String(paidStore) === String(store._id),
      ),
    };
  });
};

const confirmSellerPayment = async (userId, orderId) => {
  const store = await Store.findOne({ owner: userId }).select("_id");
  if (!store) throw new AppError("Store not found", 404);
  const session = await mongoose.startSession();
  let confirmedOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        "items.store": store._id,
      }).session(session);
      if (!order) throw new AppError("Order not found", 404);
      if (order.paymentMethod !== "COD") {
        throw new AppError("Only COD payments can be confirmed here", 400);
      }
      if (order.orderStatus !== "DELIVERED") {
        throw new AppError("Payment can only be confirmed after delivery", 400);
      }
      if (order.paymentStatus === "CANCELLED" || order.paymentStatus === "REFUNDED") {
        throw new AppError("This payment cannot be confirmed", 400);
      }
      if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "PAID") {
        throw new AppError("This payment is not awaiting confirmation", 400);
      }

      await Order.updateOne(
        { _id: order._id },
        { $addToSet: { paidStores: store._id } },
        { session },
      );
      const latestOrder = await Order.findById(order._id).session(session);
      const requiredStores = [...new Set(order.items.map((item) => String(item.store)))];
      const confirmedStores = new Set((latestOrder.paidStores || []).map(String));
      const allStoresConfirmed = requiredStores.every((id) => confirmedStores.has(id));

      if (allStoresConfirmed && latestOrder.paymentStatus !== "PAID") {
        const update = await Order.updateOne(
          { _id: order._id, paymentStatus: "PENDING" },
          { $set: { paymentStatus: "PAID" } },
          { session },
        );
        if (update.modifiedCount === 1) {
          const paymentUpdate = await Payment.updateOne(
            { order: order._id, status: "PENDING" },
            { $set: { status: "SUCCEEDED", paidAt: new Date() } },
            { session },
          );
          if (paymentUpdate.modifiedCount !== 1) {
            throw new AppError("Pending payment record not found", 409);
          }
        }
      }
      confirmedOrder = await Order.findById(order._id).session(session);
    });
  } finally {
    await session.endSession();
  }
  return confirmedOrder;
};

const getMyOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

const cancelMyOrder = async (userId, orderId) => {
  const session = await mongoose.startSession();
  let cancelledOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, user: userId }).session(session);
      if (!order) throw new AppError("Order not found", 404);
      if (order.orderStatus !== "PENDING") {
        throw new AppError("Only pending orders can be cancelled", 400);
      }
      if (order.paymentMethod !== "COD") {
        throw new AppError("Only cash-on-delivery orders can be cancelled here", 400);
      }

      for (const item of order.items) {
        if (!item.variantId) {
          throw new AppError("Cannot restore stock for this legacy order", 409);
        }
        const restored = await Product.updateOne(
          { _id: item.product, "variants._id": item.variantId },
          { $inc: { "variants.$.stock": item.quantity } },
          { session },
        );
        if (restored.modifiedCount !== 1) {
          throw new AppError("A product variant no longer exists; contact support to cancel this order", 409);
        }
      }

      const result = await Order.updateOne(
        { _id: order._id, user: userId, orderStatus: "PENDING" },
        { $set: { orderStatus: "CANCELLED", paymentStatus: "CANCELLED" } },
        { session, runValidators: true },
      );
      if (result.modifiedCount !== 1) throw new AppError("Order status changed; refresh and retry", 409);
      const paymentUpdate = await Payment.updateOne(
        { order: order._id, status: "PENDING" },
        { $set: { status: "CANCELLED" } },
        { session },
      );
      if (paymentUpdate.modifiedCount !== 1) throw new AppError("Pending payment record not found", 409);
      cancelledOrder = { ...order.toObject(), orderStatus: "CANCELLED", paymentStatus: "CANCELLED" };
    });
  } finally {
    await session.endSession();
  }
  return cancelledOrder;
};

module.exports = {
  createCodOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getSellerOrders,
  confirmSellerPayment,
};
