const { Store, Product } = require("../models");

const storageService = require("./storage.service");

const { STORAGE_LIMITS } = require("../config/storage.constants");

const AppError = require("../utils/AppError");

const createProductImageUpload = async ({
  userId,
  productId,
  fileName,
  contentType,
  fileSize,
}) => {
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
    throw new AppError("Product not found or you do not own this product", 404);
  }

  storageService.validateImage({
    fileName,
    contentType,
    fileSize,
    maxSize: STORAGE_LIMITS.PRODUCT_IMAGE_MAX_SIZE,
  });

  const fileNameGenerated = storageService.generateRandomName(fileName);

  const key = [
    "products",
    store._id.toString(),
    product._id.toString(),
    fileNameGenerated,
  ].join("/");

  const uploadUrl = await storageService.createPresignedUpload({
    key,
    contentType,
  });

  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBaseUrl) {
    const error = new Error(
      "R2_PUBLIC_URL is required to serve uploaded images",
    );
    error.statusCode = 503;
    throw error;
  }
  const publicUrl = `${publicBaseUrl}/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
    expiresIn: 300,
  };
};

const deleteProductImage = async ({ userId, productId, key }) => {
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
    throw new AppError("Product not found or you do not own this product", 404);
  }

  const image = product.images.find((item) => item.key === key);

  if (!image) {
    throw new AppError("Image not found", 404);
  }

  await storageService.deleteObject(key);

  product.images = product.images.filter((item) => item.key !== key);

  await product.save();

  return product;
};

module.exports = {
  createProductImageUpload,
  deleteProductImage,
};
