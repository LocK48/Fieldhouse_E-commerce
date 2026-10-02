const crypto = require("crypto");

const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { getStorageClient } = require("../config/storage");

const { ALLOWED_IMAGE_TYPES } = require("../config/storage.constants");

const AppError = require("../utils/AppError");

const generateRandomName = (originalName) => {
  const extension = originalName.split(".").pop().toLowerCase();

  const random = crypto.randomBytes(16).toString("hex");

  return `${Date.now()}-${random}.${extension}`;
};

const createPresignedUpload = async ({ key, contentType }) => {
  if (!process.env.R2_BUCKET_NAME) {
    const error = new Error("R2_BUCKET_NAME is required to upload files");
    error.statusCode = 503;
    throw error;
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,

    Key: key,

    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getStorageClient(), command, {
    expiresIn: 300,
  });

  return uploadUrl;
};

const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,

    Key: key,
  });

  await getStorageClient().send(command);
};

const validateImage = ({ fileName, contentType, fileSize, maxSize }) => {
  if (!fileName) {
    throw new AppError("File name is required", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new AppError("Only JPEG, PNG and WebP images are allowed", 400);
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new AppError("File size must be greater than zero", 400);
  }

  if (fileSize > maxSize) {
    throw new AppError(
      `File size must not exceed ${maxSize / 1024 / 1024}MB`,
      400,
    );
  }
};

module.exports = {
  generateRandomName,
  createPresignedUpload,
  deleteObject,
  validateImage,
};
