const express = require("express");
const router = express.Router();
const {
  contactAttachmentsUpload,
} = require("../middleware/contactAttachmentsUpload");
const {
  submitContact,
  getMessages,
  updateMessage,
  deleteMessage,
} = require("../controllers/contactController");
const { protect, adminOnly } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");
const { contactSubmitLimiter } = require("../middleware/rateLimiters");

// Public routes
router.post(
  "/",
  contactSubmitLimiter,
  contactAttachmentsUpload,
  validateBody(validationSchemas.contactSubmit),
  submitContact,
);

// Admin routes
router.get("/messages", protect, adminOnly, getMessages);
router.put(
  "/messages/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.uuidIdParam),
  validateBody(validationSchemas.updateContactMessage),
  updateMessage,
);
router.delete(
  "/messages/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.uuidIdParam),
  deleteMessage,
);

module.exports = router;
