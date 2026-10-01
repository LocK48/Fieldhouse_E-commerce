const { Product, Store, Category } = require("../models");

const AppError = require("../utils/AppError");

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

  const existingSlug = await Product.findOne({
    slug: data.slug,
  });

  if (existingSlug) {
    throw new AppError("Product slug already exists", 409);
  }

  const product = await Product.create({
    ...data,
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
    "isFeatured",
  ];

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
    filter.brand = new RegExp(brand, "i");
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter["variants.price"] = {};

    if (minPrice !== undefined) {
      filter["variants.price"].$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter["variants.price"].$lte = Number(maxPrice);
    }
  }

  if (search) {
    filter.$text = {
      $search: search,
    };
  }

  const pageNumber = Math.max(Number(page), 1);

  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

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
      .lean(),

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

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
};
