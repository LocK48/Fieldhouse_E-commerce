const { Cart, Product } = require("../models");
const AppError = require("../utils/AppError");

const MAX_ITEM_QUANTITY = 99;

const parseQuantity = (value) => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
    throw new AppError(`Quantity must be an integer between 1 and ${MAX_ITEM_QUANTITY}`, 400);
  }
  return quantity;
};

const getActiveProductVariant = async (productId, variantId) => {
  const product = await Product.findOne({ _id: productId, status: "ACTIVE" })
    .populate("store", "name status");

  if (!product || !product.store || product.store.status !== "ACTIVE") {
    throw new AppError("Product is not available", 404);
  }

  const variant = variantId
    ? product.variants.id(variantId)
    : product.variants.find((item) => item.isActive);

  if (!variant || !variant.isActive) {
    throw new AppError("Product variant is not available", 404);
  }

  return { product, variant };
};

const getOrCreateCart = async (userId) => Cart.findOneAndUpdate(
  { user: userId },
  { $setOnInsert: { user: userId, items: [], subtotal: 0 } },
  { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
);

const recalculateSubtotal = (cart) => {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return cart.subtotal;
};

const addItem = async (userId, input = {}) => {
  const { productId, variantId, quantity = 1 } = input;
  if (!productId) throw new AppError("Product ID is required", 400);
  const amount = parseQuantity(quantity);
  const { product, variant } = await getActiveProductVariant(productId, variantId);
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) =>
    item.product.toString() === product._id.toString() &&
    item.variantId?.toString() === variant._id.toString(),
  );
  const nextQuantity = (existing?.quantity || 0) + amount;

  if (nextQuantity > MAX_ITEM_QUANTITY) {
    throw new AppError(`A cart item cannot exceed ${MAX_ITEM_QUANTITY}`, 400);
  }
  if (nextQuantity > variant.stock) {
    throw new AppError("Requested quantity exceeds available stock", 409);
  }

  if (existing) {
    existing.quantity = nextQuantity;
    existing.price = variant.price;
  } else {
    cart.items.push({
      product: product._id,
      variantId: variant._id,
      quantity: amount,
      price: variant.price,
    });
  }

  recalculateSubtotal(cart);
  await cart.save();
  return getCart(userId);
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug brand images status store variants",
    populate: { path: "store", select: "name status" },
  });

  if (!cart) return { items: [], subtotal: 0 };

  let changed = false;
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const product = item.product;
    const variant = product?.variants?.id(item.variantId);
    const available = Boolean(
      product &&
      product.status === "ACTIVE" &&
      product.store?.status === "ACTIVE" &&
      variant?.isActive &&
      variant.stock >= item.quantity,
    );
    const price = variant?.price ?? item.price;

    if (item.price !== price) {
      item.price = price;
      changed = true;
    }
    subtotal += price * item.quantity;

    return {
      product: product ? {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        images: product.images,
      } : { _id: item.product },
      variant: variant ? {
        _id: variant._id,
        name: variant.name,
        sku: variant.sku,
        attributes: variant.attributes,
        price,
        stock: variant.stock,
      } : null,
      quantity: item.quantity,
      price,
      subtotal: price * item.quantity,
      available,
    };
  });

  if (cart.subtotal !== subtotal) {
    cart.subtotal = subtotal;
    changed = true;
  }
  if (changed) await cart.save();

  return { _id: cart._id, items, subtotal };
};

const updateItemQuantity = async (userId, input = {}) => {
  const { productId, variantId, quantity } = input;
  if (!productId || !variantId) {
    throw new AppError("Product ID and variant ID are required", 400);
  }
  const amount = parseQuantity(quantity);
  const { product, variant } = await getActiveProductVariant(productId, variantId);
  if (amount > variant.stock) {
    throw new AppError("Requested quantity exceeds available stock", 409);
  }

  const cart = await Cart.findOne({ user: userId });
  const item = cart?.items.find((entry) =>
    entry.product.toString() === product._id.toString() &&
    entry.variantId?.toString() === variant._id.toString(),
  );
  if (!item) throw new AppError("Cart item not found", 404);

  item.quantity = amount;
  item.price = variant.price;
  recalculateSubtotal(cart);
  await cart.save();
  return getCart(userId);
};

const removeItem = async (userId, input = {}) => {
  const { productId, variantId } = input;
  if (!productId) throw new AppError("Product ID is required", 400);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart item not found", 404);

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => {
    if (item.product.toString() !== productId) return true;
    return variantId && item.variantId?.toString() !== variantId;
  });
  if (cart.items.length === initialLength) throw new AppError("Cart item not found", 404);

  recalculateSubtotal(cart);
  await cart.save();
  return getCart(userId);
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return { items: [], subtotal: 0 };
  cart.items = [];
  cart.subtotal = 0;
  await cart.save();
  return { _id: cart._id, items: [], subtotal: 0 };
};

module.exports = {
  addItem,
  getCart,
  updateItemQuantity,
  removeItem,
  clearCart,
};
