const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  facebookLogin,
  facebookDataDeletion,
  deleteAccount,
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
  logout,
} = require("../controllers/authController");
const { protect, softProtect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { avatarUpload } = require("../config/cloudinary");
const {
  validateBody,
  validateParams,
  validationSchemas,
} = require("../middleware/validation");

// Public routes
router.post(
  "/register",
  authLimiter,
  validateBody(validationSchemas.register),
  register,
);
router.post(
  "/login",
  authLimiter,
  validateBody(validationSchemas.login),
  login,
);
router.post("/logout", logout);
router.post(
  "/google",
  authLimiter,
  validateBody(validationSchemas.oauthLogin),
  googleLogin,
);
router.post(
  "/facebook",
  authLimiter,
  validateBody(validationSchemas.oauthLogin),
  facebookLogin,
);
router.post(
  "/facebook/data-deletion",
  validateBody(validationSchemas.facebookDataDeletion),
  facebookDataDeletion,
);
router.post(
  "/forgot-password",
  authLimiter,
  validateBody(validationSchemas.forgotPassword),
  forgotPassword,
);
router.post(
  "/reset-password/:token",
  authLimiter,
  validateParams(validationSchemas.resetPasswordTokenParam),
  validateBody(validationSchemas.resetPassword),
  resetPassword,
);
router.post(
  "/verify-email",
  authLimiter,
  validateBody(validationSchemas.verifyEmail),
  verifyEmail,
);
router.post(
  "/resend-verification",
  authLimiter,
  validateBody(validationSchemas.resendVerification),
  resendVerificationEmail,
);

// Protected routes
router.get("/profile", softProtect, getProfile);
router.put(
  "/profile",
  protect,
  validateBody(validationSchemas.updateProfile),
  updateProfile,
);
router.put(
  "/change-password",
  protect,
  validateBody(validationSchemas.changePassword),
  changePassword,
);
router.post(
  "/wishlist/:productId",
  protect,
  validateParams(validationSchemas.uuidProductParam),
  toggleWishlist,
);
router.get("/wishlist", protect, getWishlist);
router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);
router.delete("/avatar", protect, deleteAvatar);
router.delete(
  "/account",
  protect,
  validateBody(validationSchemas.deleteAccount),
  deleteAccount,
);

module.exports = router;
