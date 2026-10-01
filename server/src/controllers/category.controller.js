const categoryService = require("../services/category.service");

const getCategories = async (req, res) => {
  const categories = await categoryService.getCategories();

  res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
};

const getCategory = async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      category,
    },
  });
};

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: {
      category,
    },
  });
};

const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: {
      category,
    },
  });
};

const deleteCategory = async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
