const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  toggleWishlist,
  getWishlist,
  uploadAvatar,
  deleteAvatar,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { avatarUpload } = require("../config/cloudinary");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/wishlist/:productId", protect, toggleWishlist);
router.get("/wishlist", protect, getWishlist);
router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);
router.delete("/avatar", protect, deleteAvatar);

module.exports = router;
