const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  paystackWebhook,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/initialize", protect, initializePayment);
router.get("/verify/:reference", protect, verifyPayment);
router.post("/webhook", paystackWebhook);

module.exports = router;
