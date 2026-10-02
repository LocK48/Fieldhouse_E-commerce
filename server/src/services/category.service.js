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
    const parent = await Category.findOne({ _id: data.parent, isActive: true });

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

  if (data.parent !== undefined && data.parent !== null) {
    let ancestorId = data.parent;
    const seen = new Set();
    while (ancestorId) {
      const key = String(ancestorId);
      if (key === String(categoryId) || seen.has(key)) {
        throw new AppError("Category hierarchy cannot contain a cycle", 400);
      }
      seen.add(key);
      const ancestor = await Category.findOne({
        _id: ancestorId,
        isActive: true,
      })
        .select("parent")
        .lean();
      if (!ancestor) throw new AppError("Parent category not found", 404);
      ancestorId = ancestor.parent;
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

  const hasActiveChildren = await Category.exists({
    parent: category._id,
    isActive: true,
  });
  if (hasActiveChildren) {
    throw new AppError(
      "Move or deactivate child categories before deleting this category",
      409,
    );
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
