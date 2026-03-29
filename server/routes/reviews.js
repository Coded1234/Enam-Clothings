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
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

// Public routes
router.get("/testimonials", getTestimonials);
router.get(
  "/product/:productId",
  validateParams(validationSchemas.uuidProductParam),
  optionalAuth,
  getProductReviews,
);

// Protected routes
router.post(
  "/",
  protect,
  validateBody(validationSchemas.createReview),
  createReview,
);
router.put(
  "/:id",
  protect,
  validateParams(validationSchemas.uuidIdParam),
  validateBody(validationSchemas.updateReview),
  updateReview,
);
router.delete(
  "/:id",
  protect,
  validateParams(validationSchemas.uuidIdParam),
  deleteReview,
);
router.post(
  "/:id/helpful",
  protect,
  validateParams(validationSchemas.uuidIdParam),
  markHelpful,
);

module.exports = router;
