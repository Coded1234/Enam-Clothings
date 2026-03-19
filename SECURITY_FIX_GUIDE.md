# CRITICAL SECURITY FIXES - Quick Implementation Guide

## 1. IMMEDIATE: Rotate All Secrets

### Step 1: Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: abc123def456... (copy this)
```

### Step 2: Update .env File
```bash
# server/.env - CHANGE THESE IMMEDIATELY:

# Old (COMPROMISED):
# JWT_SECRET=[REDACTED_JWT]

# New (Generate from above):
JWT_SECRET=<paste-new-generated-secret>

# Database
DB_PASSWORD=<generate-new-strong-password>

# OAuth - REGENERATE FROM SERVICES:
# Google: https://console.cloud.google.com/apis/credentials
# Facebook: https://developers.facebook.com/apps/
# Paystack: https://dashboard.paystack.com/settings/developer

GOOGLE_CLIENT_ID=<new-from-google>
FACEBOOK_APP_ID=<new-from-facebook>
FACEBOOK_APP_SECRET=<new-from-facebook>
PAYSTACK_SECRET_KEY=<new-from-paystack>

# Email - Consider using OAuth Gmail instead
EMAIL_PASS=<use-app-password-not-login-password>

# Admin - REMOVE ENTIRELY!
# DELETE THIS LINE:
# ADMIN_PASSWORD=[REDACTED_ADMIN_PWD]
# Setup admin via CLI instead (see below)
```

### Step 3: Create Admin Setup CLI Tool
**File:** `server/scripts/setup-admin.js`

```javascript
#!/usr/bin/env node

const { sequelize, User } = require("../models");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function setupAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database\n");

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    const email = await question("Admin Email: ");
    const firstName = await question("First Name: ");
    const lastName = await question("Last Name: ");
    const password = await question("Password (min 12 chars, uppercase, number, special char): ");

    // Validate password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password)) {
      throw new Error("Password too weak");
    }

    // Check if admin exists
    const existingAdmin = await User.findOne({ where: { email, role: "admin" } });
    if (existingAdmin) {
      throw new Error("Admin already exists with this email");
    }

    // Create admin
    const admin = await User.create({
      email,
      firstName,
      lastName,
      password,
      role: "admin",
      emailVerified: true,
      isActive: true,
    });

    console.log("\n✅ Admin created successfully!");
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

setupAdmin();
```

**Usage:**
```bash
cd server
node scripts/setup-admin.js
# Then enter your details (won't be logged)
```

### Step 4: Update package.json Scripts
```json
{
  "scripts": {
    "setup-admin": "node scripts/setup-admin.js"
  }
}
```

---

## 2. CRITICAL: Implement Secure Authentication (HttpOnly Cookies)

### Option A: Express Session (Simplest)

**File:** `server/config/session.js`

```javascript
const session = require('express-session');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'changeme-in-production',
  resave: false,
  saveUninitialized: false,
  store: new (require('connect-pg-simple')(session))({
    // PostgreSQL session store
    conString: process.env.DATABASE_URL,
    tableName: 'session'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // XSS protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict', // CSRF protection
    domain: process.env.COOKIE_DOMAIN || 'localhost'
  },
  name: 'sessionId' // Don't use default 'connect.sid'
};

module.exports = sessionConfig;
```

**Update:** `server/server.js`

```javascript
const session = require('express-session');
const sessionConfig = require('./config/session');

// Add BEFORE routes
app.use(session(sessionConfig));

// Update auth middleware
const protect = async (req, res, next) => {
  try {
    let userId;

    // Check session first (HttpOnly cookie)
    if (req.session && req.session.userId) {
      userId = req.session.userId;
    }
    // Fallback to Bearer token (for mobile apps)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }
    else {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    req.user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
```

**Install dependency:**
```bash
cd server && npm install express-session connect-pg-simple
```

### Option B: JWT with Refresh Tokens (More Flexible)

**Update:** `server/middleware/auth.js`

```javascript
const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m' // Short-lived
  });

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

// Update login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Send access token in response (client stores in memory)
    res.json({
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
};

// Refresh token endpoint
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
};
```

**Update Client:** `client/src/api.js`

```javascript
// Remove localStorage usage
// const token = localStorage.getItem("token");

// Instead, access token stored in memory (from login response)
let accessToken = null;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true // Allow cookies
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token (sent via HttpOnly cookie)
        const response = await api.post('/auth/refresh');
        accessToken = response.data.accessToken;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Logout user
        accessToken = null;
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { setAccessToken: (token) => (accessToken = token) };
```

---

## 3. HIGH: Add CSRF Protection

**File:** `server/middleware/csrf.js`

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

module.exports = { csrfProtection };
```

**Update:** `server/server.js`

```javascript
const cookieParser = require('cookie-parser');
const { csrfProtection } = require('./middleware/csrf');

app.use(cookieParser());
app.use(csrfProtection);

// Add CSRF token to responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Protect state-changing routes
const { csrfProtection } = require('./middleware/csrf');

router.post('/orders', csrfProtection, protect, createOrder);
router.post('/cart/add', csrfProtection, protect, addToCart);
router.post('/auth/register', csrfProtection, register);
// ... etc
```

**Install:**
```bash
npm install csurf cookie-parser
```

---

## 4. HIGH: Input Validation

**File:** `server/middleware/validation.js`

```javascript
const Joi = require('joi');

const schemas = {
  register: Joi.object({
    firstName: Joi.string().required().max(50),
    lastName: Joi.string().required().max(50),
    email: Joi.string().email().required(),
    password: Joi.string()
      .required()
      .min(12)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .error(() => new Error('Password must contain uppercase, lowercase, number, special char')),
    phone: Joi.string().optional().max(20)
  }),

  addToCart: Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(100).required(),
    size: Joi.string().optional(),
    color: Joi.object().optional()
  }),

  createOrder: Joi.object({
    shippingAddress: Joi.object({
      street: Joi.string().required().max(200),
      city: Joi.string().required().max(50),
      region: Joi.string().required().max(50),
      postalCode: Joi.string().required().max(10),
      country: Joi.string().required().max(50)
    }).required(),
    paymentMethod: Joi.string().valid('paystack', 'cod').required(),
    couponId: Joi.string().optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = { schemas, validate };
```

**Usage:**

```javascript
const { validate, schemas } = require('../middleware/validation');

router.post('/register', validate(schemas.register), register);
router.post('/cart/add', protect, validate(schemas.addToCart), addToCart);
router.post('/orders', protect, validate(schemas.createOrder), createOrder);
```

**Install:**
```bash
npm install joi
```

---

## 5. HIGH: Rate Limiting on Auth

**File:** `server/middleware/rateLimiting.js`

```javascript
const rateLimit = require('express-rate-limit');

// Aggressive on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Stricter for suspicious patterns
    if (req.body.email && req.body.email.includes('+retry')) {
      return 3; // 3 attempts for obvious retry patterns
    }
    return 5; // 5 attempts per email normally
  },
  keyGenerator: (req) => req.body.email || req.ip,
  message: 'Too many attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET'
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 resets per hour per IP
  skipSuccessfulRequests: true
});

module.exports = { authLimiter, passwordResetLimiter };
```

**Usage:**

```javascript
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiting');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);
```

---

## 6. MEDIUM: Content Security Policy

**Update:** `server/server.js`

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://accounts.google.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
        fontSrc: ["'self'", "https://fonts.googleapis.com"],
        connectSrc: [
          "'self'",
          "https://api.paystack.co",
          "https://accounts.google.com"
        ],
        frameSrc: ["'self'", "https://accounts.google.com"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true
  })
);
```

---

## 7. MEDIUM: Secure Logger

**File:** `server/config/logger.js`

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'stylestore-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log')
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

**Usage (replace console.log):**

```javascript
const logger = require('../config/logger');

// Instead of:
// console.log("Create product request body:", req.body);

// Use:
logger.info('Product created', { productId: product.id, userId: req.user.id });
logger.error('Payment failed', { error: error.message, orderId: order.id });
```

---

## Environment Variables Setup

### Create `.env.example` (SAFE - No Real Values)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stylestore
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Secrets (generate new values!)
JWT_SECRET=generate_with_crypto_randomBytes
REFRESH_SECRET=generate_new_secret
SESSION_SECRET=generate_new_secret

# OAuth (get from respective services)
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Payment
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key

# Email (use app password, not login password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=diamondauragallery@gmail.com
EMAIL_PASS=your_app_password

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
CLIENT_URL=http://localhost:3000

# Store Location
STORE_LATITUDE=5.6789
STORE_LONGITUDE=-0.1867
STORE_ADDRESS=Your Store Address

# Logging
LOG_LEVEL=info
```

### GitHub Actions Setup (Secure)

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: BenEmdon/vercel-action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          # Environment variables stored in GitHub Secrets:
          # VERCEL_ENV_JWT_SECRET
          # VERCEL_ENV_DB_PASSWORD
          # VERCEL_ENV_PAYSTACK_SECRET_KEY
          # etc.
```

---

## Testing Your Security Fixes

```bash
# 1. Test input validation
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","password":"weak"}'
# Should return validation error

# 2. Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# After 5 attempts should return 429 Too Many Requests

# 3. Test CSRF protection
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{...}' \
  --cookie "XSRF-TOKEN=wrong"
# Should return 403 Forbidden

# 4. Check security headers
curl -I http://localhost:5000
# Should see: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
```

---

## Checklist

- [ ] Generated new JWT_SECRET
- [ ] Rotated database password
- [ ] Regenerated OAuth keys
- [ ] Removed ADMIN_PASSWORD from .env
- [ ] Added .env to .gitignore
- [ ] Setup GitHub Secrets / Vercel env vars
- [ ] Implemented HttpOnly cookie authentication
- [ ] Added CSRF protection
- [ ] Added input validation
- [ ] Applied rate limiting to auth endpoints
- [ ] Implemented CSP headers
- [ ] Replaced console.log with Winston logger
- [ ] Set up admin creation script
- [ ] Tested all security fixes
- [ ] Updated .env.example with template
- [ ] Team review & sign-off

---

**Last Updated:** March 15, 2026  
**Status:** READY FOR IMPLEMENTATION
