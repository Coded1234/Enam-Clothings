const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  deleteProductImage,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getAllCustomers,
  toggleCustomerStatus,
  getAllReviews,
  toggleReviewApproval,
  getSalesReport,
} = require("../controllers/adminController");

// All routes require admin auth
router.use(protect);
router.use(adminOnly);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Products - handle optional file uploads
const optionalUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload.array("images", 5)(req, res, next);
  } else {
    next();
  }
};

router.post("/products", optionalUpload, createProduct);
router.put("/products/:id", optionalUpload, updateProduct);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id/stock", updateStock);
router.delete("/products/:id/images/:publicId", deleteProductImage);

// Orders
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Users
router.get("/users", getAllUsers);

// Customers
router.get("/customers", getAllCustomers);
router.put("/customers/:id/toggle-status", toggleCustomerStatus);

// Reviews
router.get("/reviews", getAllReviews);
router.put("/reviews/:id/approve", toggleReviewApproval);

// Reports
router.get("/reports/sales", getSalesReport);

module.exports = router;
