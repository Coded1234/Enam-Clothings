const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shippingController");
const { protect } = require("../middleware/auth");

// Calculate shipping rate for a specific address
router.post("/calculate", shippingController.calculateShippingRate);

// Get available delivery options for an address
router.post("/options", shippingController.getDeliveryOptions);

module.exports = router;
