const express = require("express");
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getSubscribers,
  getStatus,
} = require("../controllers/newsletterController");
const { protect, adminOnly } = require("../middleware/auth");

// Public routes
router.get("/status", getStatus);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Admin routes
router.get("/subscribers", protect, adminOnly, getSubscribers);

module.exports = router;
