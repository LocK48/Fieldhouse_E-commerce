const uploadService = require("../services/upload.service");

const createProductImageUpload = async (req, res) => {
  const result = await uploadService.createProductImageUpload({
    userId: req.user._id,

    productId: req.body.productId,

    fileName: req.body.fileName,

    contentType: req.body.contentType,

    fileSize: Number(req.body.fileSize),
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

const deleteProductImage = async (req, res) => {
  const product = await uploadService.deleteProductImage({
    userId: req.user._id,

    productId: req.params.productId,

    key: req.body.key,
  });

  res.status(200).json({
    success: true,
    message: "Product image deleted successfully",
    data: {
      product,
    },
  });
};

module.exports = {
  createProductImageUpload,
  deleteProductImage,
};
