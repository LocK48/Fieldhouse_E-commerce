const mongoose = require("mongoose");
const { Cart, Order, Payment, Product, Store } = require("../models");
const AppError = require("../utils/AppError");

const FREE_SHIPPING_THRESHOLD = 1_500_000;
const STANDARD_SHIPPING_FEE = 30_000;

const requiredText = (value, field, maxLength) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} is required`, 400);
  }
  const cleaned = value.trim();
  if (cleaned.length > maxLength) {
    throw new AppError(`${field} must be ${maxLength} characters or fewer`, 400);
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
    country: typeof address.country === "string" && address.country.trim()
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
        const product = await Product.findOne({ _id: cartItem.product, status: "ACTIVE" }).session(session);
        if (!product) {
          throw new AppError("A product in your cart is no longer available", 409);
        }

        const store = await Store.findOne({ _id: product.store, status: "ACTIVE" }).select("_id").session(session);
        if (!store) {
          throw new AppError("A store in your cart is no longer available", 409);
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

      const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const [order] = await Order.create([{
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
      }], { session });

      await Payment.create([{
        order: order._id,
        user: userId,
        provider: "COD",
        amount: order.total,
        currency: "VND",
        status: "PENDING",
      }], { session });

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
  const limitNumber = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;
  const filter = { user: userId };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
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

const getMyOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

module.exports = {
  createCodOrder,
  getMyOrders,
  getMyOrderById,
};
