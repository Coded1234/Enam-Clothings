const jwt = require("jsonwebtoken");
const { User } = require("../models");
const logger = require("../config/logger");

const getTokenFromCookie = (req) => req.cookies?.token || null;

// Protect routes - Authentication
const protect = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    next();
  } catch (error) {
    logger.warn("Auth middleware token verification failed", {
      error: error.message,
    });
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Soft protection for checking session silently
const softProtect = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(200).json(null);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!req.user || !req.user.isActive) {
      return res.status(200).json(null);
    }

    next();
  } catch (error) {
    return res.status(200).json(null);
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

// Optional auth - doesn't require auth but attaches user if logged in
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
    }

    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = {
  protect,
  softProtect,
  adminOnly,
  optionalAuth,
  generateToken,
};
