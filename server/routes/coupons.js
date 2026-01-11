const express = require("express");
const router = express.Router();
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  recordCouponUsage,
} = require("../controllers/couponController");
const { protect, adminOnly } = require("../middleware/auth");

// Customer routes
router.post("/validate", protect, validateCoupon);
router.post("/record-usage", protect, recordCouponUsage);

// Admin routes
router.get("/", protect, adminOnly, getAllCoupons);
router.get("/:id", protect, adminOnly, getCouponById);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;
