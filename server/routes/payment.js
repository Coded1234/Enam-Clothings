const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  paystackWebhook,
} = require("../controllers/paymentController");
const { protect, optionalAuth } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");
const { paymentVerifyLimiter } = require("../middleware/rateLimiters");

router.post(
  "/initialize",
  optionalAuth,
  validateBody(validationSchemas.paymentInitialize),
  initializePayment,
);
router.get(
  "/verify/:reference",
  paymentVerifyLimiter,
  optionalAuth,
  validateParams(validationSchemas.paymentReferenceParam),
  verifyPayment,
);
router.post("/webhook", paystackWebhook);

module.exports = router;
