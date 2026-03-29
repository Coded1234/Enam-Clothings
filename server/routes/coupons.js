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
  getActiveCoupons,
} = require("../controllers/couponController");
const { protect, adminOnly } = require("../middleware/auth");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

// Public routes
router.get("/active/homepage", getActiveCoupons);

// Customer routes
router.post(
  "/validate",
  protect,
  validateBody(validationSchemas.validateCoupon),
  validateCoupon,
);
router.post(
  "/record-usage",
  protect,
  validateBody(validationSchemas.recordCouponUsage),
  recordCouponUsage,
);

// Admin routes
router.get("/", protect, adminOnly, getAllCoupons);
router.get(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  getCouponById,
);
router.post(
  "/",
  protect,
  adminOnly,
  validateBody(validationSchemas.createCoupon),
  createCoupon,
);
router.put(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  validateBody(validationSchemas.updateCoupon),
  updateCoupon,
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  validateParams(validationSchemas.integerIdParam),
  deleteCoupon,
);

module.exports = router;
