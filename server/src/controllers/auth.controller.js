const authService = require("../services/auth.service");

const register = async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: {
      user,
    },
  });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed",
    data: result,
  });
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  await authService.logout(refreshToken);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        isVerified: req.user.isVerified,
      },
    },
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
