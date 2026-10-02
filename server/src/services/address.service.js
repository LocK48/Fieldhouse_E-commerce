const { Address } = require("../models");
const AppError = require("../utils/AppError");

const getAddresses = (userId) =>
  Address.find({ user: userId }).sort({ isDefault: -1, updatedAt: -1 }).lean();

const saveAddress = async (userId, data, addressId) => {
  const fields = [
    "recipientName",
    "phone",
    "addressLine",
    "ward",
    "district",
    "city",
    "country",
  ];
  const values = {};
  for (const field of fields)
    if (data[field] !== undefined)
      values[field] =
        typeof data[field] === "string" ? data[field].trim() : data[field];
  if (values.phone && !/^[0-9+()\s.-]{8,30}$/.test(values.phone))
    throw new AppError("Phone number is invalid", 400);
  const existing = addressId
    ? await Address.findOne({ _id: addressId, user: userId })
    : null;
  if (addressId && !existing) throw new AppError("Address not found", 404);
  const shouldBeDefault =
    data.isDefault === true ||
    (!addressId && !(await Address.exists({ user: userId })));
  if (shouldBeDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    values.isDefault = true;
  } else if (data.isDefault === false) values.isDefault = false;

  if (!addressId) return Address.create({ ...values, user: userId });
  Object.assign(existing, values);
  await existing.save();
  return existing;
};

const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOneAndDelete({
    _id: addressId,
    user: userId,
  });
  if (!address) throw new AppError("Address not found", 404);
  if (address.isDefault) {
    const next = await Address.findOne({ user: userId }).sort({
      updatedAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
};

module.exports = { getAddresses, saveAddress, deleteAddress };
