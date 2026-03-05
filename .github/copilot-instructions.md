# Copilot Instructions for The Fashion Gallery

## Project Overview

The Fashion Gallery is a full-stack e-commerce clothing store. The frontend is built with **Next.js 15** (App Router) and **React 18**, while the backend is an **Express.js** REST API backed by **PostgreSQL** via **Sequelize ORM**. Both are deployed together on **Vercel** — the Next.js app serves the UI and proxies API requests to the Express server via serverless functions.

## Repository Structure

```
/
├── app/                  # Next.js 15 App Router pages & layouts
│   ├── admin/            # Admin dashboard (product/order management)
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout flow
│   ├── login/            # Authentication pages
│   ├── orders/           # Order history & tracking
│   ├── payment/          # Payment processing (Paystack)
│   ├── product/[id]/     # Individual product detail pages
│   ├── profile/          # User profile
│   └── shop/             # Product listing / browsing
├── api/                  # Next.js API route — proxies to Express in production
│   └── [...path].js
├── server/               # Express.js backend
│   ├── config/           # Database (Sequelize) and service config
│   ├── controllers/      # Route handler logic
│   ├── middleware/        # Auth (JWT), error handling, validation
│   ├── models/           # Sequelize models (User, Product, Order, etc.)
│   ├── routes/           # Express routers
│   └── scripts/          # DB seed / migration scripts
├── client/               # Legacy Create-React-App (not actively used)
├── public/               # Static assets
├── next.config.js        # Next.js config (dev proxy to Express on port 5000)
├── tailwind.config.js    # Tailwind CSS theme (gold/primary color palette)
└── vercel.json           # Vercel deployment config
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, Redux Toolkit, Axios, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Sequelize ORM |
| Auth | JWT (jsonwebtoken), bcryptjs; Google OAuth via `@react-oauth/google` |
| Payments | Paystack |
| Images | Cloudinary (multer-storage-cloudinary) |
| Email | Nodemailer (Gmail SMTP) |
| Maps/Delivery | Leaflet, react-leaflet, Yango Delivery API |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Deployment | Vercel |

## Development Commands

```bash
# Install all dependencies (root + client + server)
npm run install-all

# Start Next.js dev server (frontend, port 3000)
npm run dev

# Start Express backend (port 5000)
npm run dev-server

# Build for production (Vercel)
npm run build

# Create / seed the PostgreSQL database
cd server && npm run db:create
```

## Environment Variables

Copy `server/.env.example` (if present) or create `server/.env` with:

```
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
ADMIN_EMAIL=...

PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...

NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

Never commit secrets. All `NEXT_PUBLIC_*` variables are exposed to the browser — do not put secrets in them.

## Coding Conventions

- **Frontend**: Use the Next.js App Router (`app/` directory). Prefer React Server Components where possible; add `"use client"` only when browser APIs or hooks are required.
- **Styling**: Use **Tailwind CSS** utility classes. Custom theme colours (e.g. `primary`, gold tones) are defined in `tailwind.config.js`.
- **State management**: Use **Redux Toolkit** slices in the existing store for global state. Use React `useState`/`useContext` for purely local UI state.
- **API calls**: Use **Axios** and the existing service helpers under `app/` or `client/src/`. Point requests at `/api/...` (proxied to Express in both dev and production).
- **Backend**: Follow the existing MVC pattern — add routes in `server/routes/`, controllers in `server/controllers/`, and Sequelize models in `server/models/`.
- **Auth**: Protect backend routes using the existing JWT middleware in `server/middleware/`. Use role-based access (`admin` vs `user`) where appropriate.
- **Error handling**: Use the centralised error-handling middleware in `server/middleware/`. Return consistent `{ success, message, data }` JSON responses.
- **Validation**: Use the `validator` package and existing middleware patterns for input validation on the backend.

## Testing

There are no automated test scripts configured at the root level. The file `test_admin_users.py` is a standalone Python script for ad-hoc admin API testing. When adding new features, manually test via:
1. The running dev servers (`npm run dev` + `npm run dev-server`).
2. The Swagger UI at `http://localhost:5000/api-docs` (backend).

## Key Integrations

- **Paystack**: Payment initialisation and webhook verification. See `PAYSTACK_SETUP.md` and `PAYSTACK_TEST_CARDS.md`.
- **Cloudinary**: Product image upload/storage. Images are uploaded via multer middleware in the Express server.
- **Yango Delivery**: Optional delivery cost estimation. Falls back to distance-based calculation when API keys are absent. See `YANGO_DELIVERY_SETUP.md`.
- **Nodemailer**: Order confirmation, email verification, and contact form emails. See `EMAIL_VERIFICATION_SETUP.md`.
