const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  getRelatedProducts,
  searchProducts,
  getCategories,
} = require("../controllers/productController");

// All routes are public
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/search", searchProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);
router.get("/:id/related", getRelatedProducts);

module.exports = router;
