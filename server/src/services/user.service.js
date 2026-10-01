const bcrypt = require("bcryptjs");

const { User } = require("../models");

const AppError = require("../utils/AppError");

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  sellerStatus: user.sellerStatus,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return getPublicUser(user);
};

const updateProfile = async (userId, data) => {
  const allowedFields = ["name", "avatar"];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return getPublicUser(user);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.password);

  if (!valid) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = await bcrypt.hash(newPassword, 12);

  await user.save();
};

const applySeller = async (userId, { businessName, description, reason }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "ADMIN") {
    throw new AppError("Admin cannot apply as seller", 400);
  }

  if (user.sellerStatus === "APPROVED") {
    throw new AppError("You are already an approved seller", 400);
  }

  if (user.sellerStatus === "PENDING") {
    throw new AppError("Seller application is already pending", 409);
  }

  user.sellerStatus = "PENDING";

  user.sellerApplication = {
    businessName,
    description,
    reason,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  await user.save();

  return getPublicUser(user);
};

module.exports = {
  getPublicUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  applySeller,
};
