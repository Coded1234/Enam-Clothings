const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} = require("../controllers/categoryController");
const { protect, adminOnly } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

// Public routes
router.get("/", getAllCategories);
router.get(
  "/:id",
  validateParams(validationSchemas.integerIdParam),
  getCategoryById,
);

// Admin routes
router.post(
  "/",
  protect,
  adminOnly,
  validateBody(validationSchemas.createCategory),
  createCategory,
);
router.put(
  "/reorder",
  protect,
  adminOnly,
  validateBody(validationSchemas.reorderCategories),
  reorderCategories,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  validateBody(validationSchemas.updateCategory),
  updateCategory,
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  deleteCategory,
);

module.exports = router;
