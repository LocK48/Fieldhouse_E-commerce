const userService = require("../services/user.service");

const getMe = async (req, res) => {
  const user = await userService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
};

const updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await userService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const applySeller = async (req, res) => {
  const user = await userService.applySeller(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Seller application submitted successfully",
    data: { user },
  });
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  applySeller,
};
