const express = require("express");
const router = express.Router();
const {
  getSettings,
  getPublicSettings,
  updateSettings,
  bulkUpdateSettings,
  resetSettings,
} = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/auth");

// Public routes
router.get("/public", getPublicSettings);

// Admin routes
router.get("/", protect, adminOnly, getSettings);
router.put("/", protect, adminOnly, updateSettings);
router.put("/bulk", protect, adminOnly, bulkUpdateSettings);
router.post("/reset", protect, adminOnly, resetSettings);

module.exports = router;
