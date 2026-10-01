const productService = require("../services/product.service");

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Product created and submitted for approval",
    data: {
      product,
    },
  });
};

const getProducts = async (req, res) => {
  const result = await productService.getProducts(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

const getProduct = async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      product,
    },
  });
};

const getMyProducts = async (req, res) => {
  const products = await productService.getMyProducts(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      products,
    },
  });
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(
    req.user._id,
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: {
      product,
    },
  });
};

const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Product archived successfully",
  });
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
};
