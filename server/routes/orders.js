const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);
router.get("/:id/track", trackOrder);

module.exports = router;
