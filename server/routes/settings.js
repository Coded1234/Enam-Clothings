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
const { validateBody, validationSchemas } = require("../middleware/validation");

// Public routes
router.get("/public", getPublicSettings);

// Admin routes
router.get("/", protect, adminOnly, getSettings);
router.put(
  "/",
  protect,
  adminOnly,
  validateBody(validationSchemas.updateSettings),
  updateSettings,
);
router.put(
  "/bulk",
  protect,
  adminOnly,
  validateBody(validationSchemas.bulkUpdateSettings),
  bulkUpdateSettings,
);
router.post("/reset", protect, adminOnly, resetSettings);

module.exports = router;
