const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const logger = require("./config/logger");

// Load environment variables
dotenv.config();

// Import database connection
const { connectDB } = require("./config/database");
require("./models"); // Initialize models and associations

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const newsletterRoutes = require("./routes/newsletter");
const contactRoutes = require("./routes/contact");
const settingsRoutes = require("./routes/settings");
const couponRoutes = require("./routes/coupons");
const categoryRoutes = require("./routes/categories");
const shippingRoutes = require("./routes/shipping");
const announcementRoutes = require("./routes/announcements");
const xssMiddleware = require("./middleware/xss");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

const resolveTrustProxySetting = () => {
  if (!isProduction) return false;

  const configuredValue = process.env.TRUST_PROXY;
  if (!configuredValue) return 1;

  if (configuredValue === "false") return false;
  if (configuredValue === "true") return 1;
  if (/^\d+$/.test(configuredValue)) return Number(configuredValue);
  return configuredValue;
};

// Only trust proxy headers in production and allow explicit override via TRUST_PROXY.
app.set("trust proxy", resolveTrustProxySetting());

// Enforce HTTPS in production
if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(301, `https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
        ],
        imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https://api.paystack.co",
          "https://api.cloudinary.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow static uploads to load
    noSniff: true,
  }),
);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Apply a higher limit for GET requests instead of completely skipping them
    if (req.method === "GET") {
      return process.env.NODE_ENV === "production" ? 2000 : 5000;
    }
    return process.env.NODE_ENV === "production" ? 500 : 2000;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
});

app.use(generalLimiter);

// CORS
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "https://diamondauragallery.vercel.app",
    "https://diamondauragallery-admin.vercel.app",
    "https://enam-clothings.vercel.app",
  ].filter(Boolean),
);

if (process.env.VERCEL_URL) {
  allowedOrigins.add(`https://${process.env.VERCEL_URL}`);
}

const allowLocalhostCors = !isProduction;
const allowPrivateNetworkCors =
  process.env.ALLOW_PRIVATE_NETWORK_CORS === "true";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);

      const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );
      const isPrivateNetworkOrigin =
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        );

      // Allow exact predefined deployment domains
      if (
        allowedOrigins.has(origin) ||
        (allowLocalhostCors && isLocalOrigin) ||
        (allowPrivateNetworkCors && isPrivateNetworkOrigin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(xssMiddleware());

// Prevent HTTP Parameter Pollution
const hpp = require("hpp");
app.use(hpp());

const csrf = require("@dr.pogodin/csurf");
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

app.use((req, res, next) => {
  // Exclude webhooks from CSRF checks
  if (req.path === "/api/v1/payment/webhook" || req.path === "/api/webhook") {
    return next();
  }

  csrfProtection(req, res, next);
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Protect API docs with basic authentication
const swaggerBasicAuth = (req, res, next) => {
  const auth = Buffer.from(
    (req.headers.authorization || "").replace("Basic ", ""),
    "base64",
  ).toString();
  const [user, pass] = auth.split(":");

  // NEVER hardcode credentials directly in the codebase for production!
  // These are now required to be configured in your .env file
  const expectedUser = process.env.SWAGGER_USER;
  const expectedPass = process.env.SWAGGER_PASSWORD;

  // If either credential isn't set, block access entirely as a fail-safe
  if (
    !expectedUser ||
    !expectedPass ||
    user !== expectedUser ||
    pass !== expectedPass
  ) {
    res.setHeader("WWW-Authenticate", 'Basic realm="API Docs"');
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerBasicAuth,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "StyleStore API Documentation",
  }),
);

// API Versioning prefix
const API_PREFIX = "/api/v1";

app.get(`${API_PREFIX}/csrf-token`, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/payment`, paymentRoutes);
app.use(`${API_PREFIX}/newsletter`, newsletterRoutes);
app.use(`${API_PREFIX}/contact`, contactRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/shipping`, shippingRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);

// Keep old unversioned health endpoint or map it
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running!" });
});
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({ status: "Server is running (v1)!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  void next;
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      message: "Invalid CSRF Token. Please refresh the page and try again.",
    });
  }

  logger.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// Connect to PostgreSQL and start server
const PORT = process.env.PORT || 5000;
const { initCronJobs } = require("./utils/cronJobs");

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      initCronJobs(); // Initialize background cron jobs
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== "1") {
  startServer();
} else {
  // Connect to database in serverless mode
  connectDB().catch((err) => logger.error("Database connection error:", err));
}

module.exports = app;
