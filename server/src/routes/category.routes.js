const express = require("express");

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const { authenticate, authorize } = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(getCategories));

router.get("/:id", asyncHandler(getCategory));

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(createCategory),
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(updateCategory),
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(deleteCategory),
);

module.exports = router;
