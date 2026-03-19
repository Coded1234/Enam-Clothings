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

// Public routes
router.post("/", contactAttachmentsUpload, submitContact);

// Admin routes
router.get("/messages", protect, adminOnly, getMessages);
router.put("/messages/:id", protect, adminOnly, updateMessage);
router.delete("/messages/:id", protect, adminOnly, deleteMessage);

module.exports = router;
