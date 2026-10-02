const { Product, Store, Category } = require("../models");

const AppError = require("../utils/AppError");
const slugify = require("../utils/slugify");

const createProduct = async (userId, data) => {
  const store = await Store.findOne({
    owner: userId,
    status: "ACTIVE",
  });

  if (!store) {
    throw new AppError("You do not have an active store", 403);
  }

  const category = await Category.findOne({
    _id: data.category,
    isActive: true,
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const slug = slugify(data.slug || data.name);
  if (!slug) {
    throw new AppError("Product name must contain letters or numbers", 400);
  }

  const existingSlug = await Product.findOne({
    store: store._id,
    slug,
  });

  if (existingSlug) {
    throw new AppError("Product slug already exists", 409);
  }

  validateVariants(data.variants);

  const product = await Product.create({
    ...data,
    slug,
    store: store._id,
    status: "PENDING",
  });

  return product;
};

const getProductById = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    status: "ACTIVE",
  })
    .populate("category", "name slug")
    .populate("store", "name slug logo");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const getMyProducts = async (userId) => {
  const store = await Store.findOne({
    owner: userId,
  });

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  return Product.find({
    store: store._id,
  })
    .populate("category", "name slug")
    .sort({
      createdAt: -1,
    });
};

const updateProduct = async (userId, productId, data) => {
  const store = await Store.findOne({
    owner: userId,
  });

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const product = await Product.findOne({
    _id: productId,
    store: store._id,
  });

  if (!product) {
    throw new AppError("Product not found or you do not own it", 404);
  }

  const allowedFields = [
    "name",
    "description",
    "brand",
    "category",
    "images",
    "variants",
  ];

  if (data.variants !== undefined) {
    validateVariants(data.variants);
  }

  if (data.category !== undefined) {
    const category = await Category.findOne({
      _id: data.category,
      isActive: true,
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      product[field] = data[field];
    }
  }

  await product.save();

  return product;
};

const deleteProduct = async (userId, productId) => {
  const store = await Store.findOne({
    owner: userId,
  });

  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const product = await Product.findOne({
    _id: productId,
    store: store._id,
  });

  if (!product) {
    throw new AppError("Product not found or you do not own it", 404);
  }

  product.status = "ARCHIVED";

  await product.save();
};

const getProducts = async ({
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  sort = "newest",
  page = 1,
  limit = 20,
}) => {
  const filter = {
    status: "ACTIVE",
  };

  if (category) {
    filter.category = category;
  }

  if (brand) {
    const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.brand = new RegExp(escapedBrand, "i");
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceRange = {};
    if (minPrice !== undefined && Number.isFinite(Number(minPrice))) {
      priceRange.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) {
      priceRange.$lte = Number(maxPrice);
    }
    filter.variants = { $elemMatch: { price: priceRange, isActive: true } };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);
  const pageNumber = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
  const limitNumber = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 20;

  const skip = (pageNumber - 1) * limitNumber;

  let sortOption = {
    createdAt: -1,
  };

  switch (sort) {
    case "price_asc":
      sortOption = {
        "variants.price": 1,
      };
      break;

    case "price_desc":
      sortOption = {
        "variants.price": -1,
      };
      break;

    case "rating":
      sortOption = {
        averageRating: -1,
      };
      break;

    case "newest":
    default:
      sortOption = {
        createdAt: -1,
      };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("store", "name slug logo")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .lean({ virtuals: true }),

    Product.countDocuments(filter),
  ]);

  return {
    products,
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

const validateVariants = (variants = []) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new AppError("At least one product variant is required", 400);
  }

  const skuSet = new Set();

  for (const variant of variants) {
    const sku = String(variant.sku || "")
      .trim()
      .toUpperCase();
    if (!sku) {
      throw new AppError("Every variant must have a SKU", 400);
    }

    if (skuSet.has(sku)) {
      throw new AppError(`Duplicate SKU: ${variant.sku}`, 400);
    }

    skuSet.add(sku);

    if (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0) {
      throw new AppError("Variant price must be a non-negative number", 400);
    }

    if (!Number.isFinite(Number(variant.stock)) || Number(variant.stock) < 0) {
      throw new AppError("Variant stock must be a non-negative number", 400);
    }
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  validateVariants,
};
