const express = require("express");
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getSubscribers,
  getStatus,
} = require("../controllers/newsletterController");
const { protect, adminOnly } = require("../middleware/auth");
const { newsletterLimiter } = require("../middleware/rateLimiters");

// Public routes
router.get("/status", getStatus);
router.post("/subscribe", newsletterLimiter, subscribe);
router.post("/unsubscribe", newsletterLimiter, unsubscribe);

// Admin routes
router.get("/subscribers", protect, adminOnly, getSubscribers);

module.exports = router;
