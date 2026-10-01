const adminService = require("../services/admin.service");

const getSellerApplications = async (req, res) => {
  const applications = await adminService.getSellerApplications();

  res.status(200).json({
    success: true,
    data: {
      applications,
    },
  });
};

const approveSeller = async (req, res) => {
  const user = await adminService.approveSeller(
    req.user._id,
    req.params.userId,
  );

  res.status(200).json({
    success: true,
    message: "Seller approved successfully",
    data: { user },
  });
};

const rejectSeller = async (req, res) => {
  const user = await adminService.rejectSeller(
    req.user._id,
    req.params.userId,
    req.body.rejectionReason,
  );

  res.status(200).json({
    success: true,
    message: "Seller application rejected",
    data: { user },
  });
};

const approveStore = async (req, res) => {
  const store = await adminService.approveStore(req.params.storeId);

  res.status(200).json({
    success: true,
    message: "Store approved successfully",
    data: { store },
  });
};

const suspendStore = async (req, res) => {
  const store = await adminService.suspendStore(req.params.storeId);

  res.status(200).json({
    success: true,
    message: "Store suspended successfully",
    data: { store },
  });
};

module.exports = {
  getSellerApplications,
  approveSeller,
  rejectSeller,
  approveStore,
  suspendStore,
};
