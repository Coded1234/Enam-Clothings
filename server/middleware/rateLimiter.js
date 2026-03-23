const rateLimit = require("express-rate-limit");

// General rate limiter for general endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Strict rate limiter for authentication endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  message:
    "Too many authentication attempts, please try again after 15 minutes",
});

// Strict rate limiter for order endpoints to prevent card testing or spam
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 orders per hour per IP
  message: "Too many order requests, please try again later",
});

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter,
};
