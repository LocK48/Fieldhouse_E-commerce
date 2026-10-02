const STORAGE_LIMITS = {
  PRODUCT_IMAGE_MAX_SIZE: 5 * 1024 * 1024,

  AVATAR_MAX_SIZE: 2 * 1024 * 1024,

  STORE_IMAGE_MAX_SIZE: 5 * 1024 * 1024,
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

module.exports = {
  STORAGE_LIMITS,
  ALLOWED_IMAGE_TYPES,
};
