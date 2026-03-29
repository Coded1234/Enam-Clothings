const rateLimit = require("express-rate-limit");

const standardLimiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 40,
  ...standardLimiterOptions,
  message: { message: "Too many newsletter requests. Please try again later." },
});

const contactSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 20,
  ...standardLimiterOptions,
  message: { message: "Too many contact submissions. Please try again later." },
});

const paymentVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 120,
  ...standardLimiterOptions,
  message: {
    message: "Too many payment verification attempts. Please try again later.",
  },
});

module.exports = {
  newsletterLimiter,
  contactSubmitLimiter,
  paymentVerifyLimiter,
};
