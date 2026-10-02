const service = require("../services/address.service");

const getAddresses = async (req, res) =>
  res.json({
    success: true,
    data: { addresses: await service.getAddresses(req.user._id) },
  });
const createAddress = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      data: { address: await service.saveAddress(req.user._id, req.body) },
    });
const updateAddress = async (req, res) =>
  res.json({
    success: true,
    data: {
      address: await service.saveAddress(
        req.user._id,
        req.body,
        req.params.addressId,
      ),
    },
  });
const deleteAddress = async (req, res) => {
  await service.deleteAddress(req.user._id, req.params.addressId);
  res.json({ success: true });
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
