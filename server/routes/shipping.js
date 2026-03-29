const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shippingController");
const { validateBody, validationSchemas } = require("../middleware/validation");

// Calculate shipping rate for a specific address
router.post(
  "/calculate",
  validateBody(validationSchemas.shippingRequest),
  shippingController.calculateShippingRate,
);

// Get available delivery options for an address
router.post(
  "/options",
  validateBody(validationSchemas.shippingRequest),
  shippingController.getDeliveryOptions,
);

module.exports = router;
