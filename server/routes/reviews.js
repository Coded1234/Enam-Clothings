const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getTestimonials,
} = require("../controllers/reviewController");
const { protect, optionalAuth } = require("../middleware/auth");

// Public routes
router.get("/testimonials", getTestimonials);
router.get("/product/:productId", optionalAuth, getProductReviews);

// Protected routes
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.post("/:id/helpful", protect, markHelpful);

module.exports = router;
