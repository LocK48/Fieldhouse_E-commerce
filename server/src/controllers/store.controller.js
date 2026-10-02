const storeService = require("../services/store.service");

const createStore = async (req, res) => {
  const store = await storeService.createStore(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Store created successfully",
    data: { store },
  });
};

const getMyStore = async (req, res) => {
  const store = await storeService.getMyStore(req.user._id);

  res.status(200).json({
    success: true,
    data: { store },
  });
};

const getPublicStore = async (req, res) => {
  const data = await storeService.getPublicStore(req.params.slug);
  res.status(200).json({ success: true, data });
};

const updateMyStore = async (req, res) => {
  const store = await storeService.updateMyStore(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Store updated successfully",
    data: { store },
  });
};

module.exports = {
  createStore,
  getMyStore,
  getPublicStore,
  updateMyStore,
};
