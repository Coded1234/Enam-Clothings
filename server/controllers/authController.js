const { User, Wishlist, Product } = require("../models");
const { generateToken } = require("../middleware/auth");
const { sendEmail, emailTemplates } = require("../config/email");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Validate role (only allow 'customer' or 'admin')
    const validRoles = ["customer", "admin"];
    const userRole = validRoles.includes(role) ? role : "customer";

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: userRole,
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const { subject, html } = emailTemplates.emailVerification(
        user,
        verificationToken,
      );
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
    }

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        message:
          "Please verify your email address before logging in. Check your inbox for the verification link.",
        emailVerified: false,
      });
    }

    res.json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findByPk(req.user.id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

// @desc    Add/Remove from wishlist
// @route   POST /api/auth/wishlist/:productId
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if item exists in wishlist
    const existing = await Wishlist.findOne({
      where: { userId: req.user.id, productId },
    });

    if (existing) {
      await existing.destroy();
    } else {
      await Wishlist.create({ userId: req.user.id, productId });
    }

    // Get updated wishlist
    const wishlist = await Wishlist.findAll({
      where: { userId: req.user.id },
      attributes: ["productId"],
    });

    res.json({ wishlist: wishlist.map((w) => w.productId) });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating wishlist", error: error.message });
  }
};

// @desc    Get wishlist
// @route   GET /api/auth/wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: "product" }],
    });
    res.json(wishlist.map((w) => w.product));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching wishlist", error: error.message });
  }
};

// @desc    Upload avatar
// @route   POST /api/auth/avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate file type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "image/heic",
      "image/heif",
      "image/avif",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Invalid file type. Only image files are allowed",
      });
    }

    // Validate file size (2MB max)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        message: "File size too large. Maximum size is 2MB",
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the avatar URL
    let avatarUrl;
    if (req.file.path) {
      // Local storage - construct URL
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    } else if (req.file.location) {
      // S3/Cloudinary URL
      avatarUrl = req.file.location;
    } else {
      avatarUrl = req.file.filename;
    }

    // Delete old avatar file if it exists and is stored locally
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldAvatarPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res
      .status(500)
      .json({ message: "Error uploading avatar", error: error.message });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      const { subject, html } = emailTemplates.passwordReset(user, resetUrl);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res
        .status(500)
        .json({ message: "Failed to send reset email. Please try again." });
    }

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (user.resetPasswordExpires < new Date()) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(400).json({
        message: "Reset token has expired. Please request a new one.",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send confirmation email
    try {
      const { subject, html } = emailTemplates.passwordChanged(user);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error("Password changed confirmation email failed:", emailError);
    }

    res.json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

// @desc    Delete avatar
// @route   DELETE /api/auth/avatar
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.avatar) {
      return res.status(400).json({ message: "No avatar to delete" });
    }

    // Delete avatar file if stored locally
    if (user.avatar.startsWith("/uploads/avatars/")) {
      const avatarPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    user.avatar = null;
    await user.save();

    res.json({
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    res
      .status(500)
      .json({ message: "Error deleting avatar", error: error.message });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // Verify the email
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    await user.save();

    // Send welcome email after verification
    try {
      const { subject, html } = emailTemplates.welcomeEmail(user);
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    // Generate JWT token to auto-login user
    const authToken = generateToken(user.id);

    res.json({
      message: "Email verified successfully! You are now logged in.",
      emailVerified: true,
      token: authToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      message: "Error verifying email",
      error: error.message,
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const { subject, html } = emailTemplates.emailVerification(
        user,
        verificationToken,
      );
      await sendEmail(user.email, subject, html);
    } catch (emailError) {
      console.error("Verification email failed:", emailError);
      return res.status(500).json({
        message: "Failed to send verification email",
      });
    }

    res.json({
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      message: "Error resending verification email",
      error: error.message,
    });
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Get user info from Google using access token
    const googleResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const { name, email, sub: googleId, picture } = googleResponse.data;

    // Split name into first and last
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    let user = await User.findOne({ where: { email } });

    if (user) {
      // User exists, update googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      const randomPassword = crypto.randomBytes(16).toString("hex");

      user = await User.create({
        firstName,
        lastName: lastName || "User",
        email,
        password: randomPassword,
        googleId,
        emailVerified: true,
        isActive: true,
        role: "customer",
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    res.json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Google login error:", error);
    res
      .status(500)
      .json({ message: "Google login failed", error: error.message });
  }
};

// @desc    Facebook Login
// @route   POST /api/auth/facebook
const facebookLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Get user info from Facebook Graph API
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
    );

    const { id: facebookId, name, email, picture } = fbResponse.data;

    if (!email) {
      return res.status(400).json({
        message:
          "Facebook account does not have a public email. Please use a different login method.",
      });
    }

    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({
        firstName,
        lastName: lastName || "User",
        email,
        password: randomPassword,
        emailVerified: true,
        isActive: true,
        role: "customer",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    res.json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Facebook login error:", error);
    res
      .status(500)
      .json({ message: "Facebook login failed", error: error.message });
  }
};

// @desc    Delete own account
// @route   DELETE /api/auth/account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Require password confirmation (skip for OAuth-only accounts)
    if (user.password) {
      const { password } = req.body;
      if (!password) {
        return res
          .status(400)
          .json({ message: "Please enter your password to confirm" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    }

    // Anonymise instead of hard-delete to preserve order history
    await user.update({
      firstName: "Deleted",
      lastName: "User",
      email: `deleted_${user.id}@deleted.invalid`,
      phone: null,
      googleId: null,
      address: {},
      isActive: false,
      emailVerified: false,
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete account", error: error.message });
  }
};

// @desc    Facebook Data Deletion Callback
// @route   POST /api/auth/facebook/data-deletion
const facebookDataDeletion = async (req, res) => {
  try {
    const { signed_request } = req.body;

    if (!signed_request) {
      return res.status(400).json({ message: "Missing signed_request" });
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET;

    // Parse the signed request
    const [encodedSig, payload] = signed_request.split(".");

    // Decode payload
    const data = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    );

    // Verify signature if app secret is configured
    if (appSecret) {
      const expectedSig = crypto
        .createHmac("sha256", appSecret)
        .update(payload)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      if (encodedSig !== expectedSig) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    const facebookUserId = data.user_id;

    // Find and delete (or anonymise) the user
    // Note: Facebook login is no longer active; no user records to anonymise by facebookId
    void facebookUserId;

    // Generate a confirmation code
    const confirmationCode = crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase();

    const statusUrl = `${process.env.CLIENT_URL}/data-deletion-status?code=${confirmationCode}`;

    // Facebook requires this exact JSON shape
    return res.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Facebook data deletion error:", error);
    res
      .status(500)
      .json({ message: "Data deletion request failed", error: error.message });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  facebookLogin,
  facebookDataDeletion,
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
  deleteAccount,
};
