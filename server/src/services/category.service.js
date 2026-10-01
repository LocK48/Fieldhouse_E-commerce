const { Category } = require("../models");

const AppError = require("../utils/AppError");

const getCategories = async () => {
  return Category.find({
    isActive: true,
  })
    .sort({
      sortOrder: 1,
      name: 1,
    })
    .lean();
};

const getCategoryById = async (categoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

const createCategory = async (data) => {
  const existing = await Category.findOne({
    slug: data.slug,
  });

  if (existing) {
    throw new AppError("Category slug already exists", 409);
  }

  if (data.parent) {
    const parent = await Category.findById(data.parent);

    if (!parent) {
      throw new AppError("Parent category not found", 404);
    }
  }

  return Category.create(data);
};

const updateCategory = async (categoryId, data) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (data.slug) {
    const duplicate = await Category.findOne({
      slug: data.slug,
      _id: {
        $ne: categoryId,
      },
    });

    if (duplicate) {
      throw new AppError("Category slug already exists", 409);
    }
  }

  Object.assign(category, data);

  await category.save();

  return category;
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  category.isActive = false;

  await category.save();
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
