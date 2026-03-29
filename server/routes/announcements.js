const express = require("express");
const router = express.Router();
const {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, adminOnly } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

// Public
router.get("/active", getActiveAnnouncements);

// Admin only
router.get("/", protect, adminOnly, getAllAnnouncements);
router.post(
  "/",
  protect,
  adminOnly,
  validateBody(validationSchemas.createAnnouncement),
  createAnnouncement,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  validateBody(validationSchemas.updateAnnouncement),
  updateAnnouncement,
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  deleteAnnouncement,
);

module.exports = router;
