# Diamond Aura Gallery - E-commerce Store

A full-stack e-commerce clothing store built with Next.js, Node.js, Express, and PostgreSQL.

## Features

- User authentication and authorization
- Product browsing and search
- Shopping cart functionality
- Order management
- Payment integration with Paystack
- Admin dashboard
- Product reviews and ratings
- Wishlist
- Coupon system
- Newsletter subscription
- Contact form

## Tech Stack

### Frontend
- **Next.js 15** (App Router) — React framework for server-side rendering and routing
- **React 18** — UI library
- **Redux Toolkit** — State management
- **Tailwind CSS** — Utility-first CSS styling
- **Framer Motion** — Animations
- **Axios** — HTTP client
- **React Icons** — Icon library
- **React Leaflet** — Interactive maps
- **React Hot Toast** — Toast notifications
- **Google OAuth** (`@react-oauth/google`) — Social login

### Backend
- **Node.js** — JavaScript runtime
- **Express 4** — Web framework
- **PostgreSQL** — Relational database
- **Sequelize ORM** — Database modeling and migrations
- **JWT** (`jsonwebtoken`) — Authentication
- **bcryptjs** — Password hashing
- **Cloudinary** — Image hosting and management
- **Nodemailer** — Email sending (Gmail SMTP)
- **Multer** — File upload handling
- **Helmet** — HTTP security headers
- **express-rate-limit** — API rate limiting
- **Swagger / OpenAPI** (`swagger-jsdoc`, `swagger-ui-express`) — API documentation
- **nodemon** — Development auto-restart

### Deployment & Infrastructure
- **Vercel** — Hosting (Next.js frontend + Express via serverless functions)
- **Hostinger VPS** — Alternative self-hosted deployment using Nginx + PM2 (see [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md))

## Deployment

> **Hosting options at a glance**
>
> | Platform | Best for | Guide |
> |----------|----------|-------|
> | **Vercel** | Quickest setup, free tier available | [See below](#vercel-deployment) |
> | **Hostinger VPS** | Full control, custom domains, Node.js VPS | [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md) |
>
> Hostinger's standard **shared web hosting** plans do **not** support Node.js and are **not** compatible with this project. You must use a **Hostinger VPS** (KVM) plan.

### Vercel Deployment

1. **Prerequisites**
   - GitHub account with your code pushed
   - Vercel account
   - PostgreSQL database (e.g., Neon, Supabase, or Railway)
   - Cloudinary account for image hosting

2. **Environment Variables**

   Set up the following environment variables in your Vercel project settings:

   **Required — Database & Server:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-vercel-domain.vercel.app
   ```

   **Required — Cloudinary (image hosting):**
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   **Required — Email (Nodemailer / Gmail SMTP):**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=diamondauragallery@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ADMIN_EMAIL=diamondauragallery@gmail.com
   ```

   **Required — Payment (Paystack):**
   ```
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

   **Required — Frontend (Next.js public variables):**
   ```
   NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```

   **Optional — Google & Facebook OAuth (server-side):**
   ```
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

   **Optional — Yango Delivery API:**
   ```
   YANGO_API_URL=https://b2b.yango.com/api/b2b
   YANGO_API_KEY=your_yango_api_key
   YANGO_CLIENT_ID=your_yango_client_id
   STORE_LATITUDE=5.6037
   STORE_LONGITUDE=-0.1870
   STORE_ADDRESS=Accra, Ghana
   ```

   > **Notes:**
   > - `DATABASE_URL` should be a full PostgreSQL connection string (e.g. from [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)).
   > - `EMAIL_PASS` must be a Gmail **App Password**, not your regular Gmail password. Enable 2FA on your Google account, then generate an App Password at <https://myaccount.google.com/apppasswords>.
   > - `NEXT_PUBLIC_*` variables are exposed to the browser; never put secrets in them.
   > - Yango variables are optional — the shipping calculator falls back to a distance-based estimate when they are absent.

3. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   
   # Deploy to production
   vercel --prod
   ```

   Or simply:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

4. **Database Setup**

   After deployment, run the database creation script:
   ```bash
   node server/scripts/createDatabase.js
   ```

### Hostinger VPS Deployment

For a full step-by-step guide on deploying to **Hostinger VPS** (Nginx + PM2 + Let's Encrypt), see [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md).

**Quick overview:**
1. Provision a Hostinger **KVM VPS** (Ubuntu 22.04, ≥ 2 GB RAM).
2. Install Node.js 20, PostgreSQL, PM2, and Nginx on the VPS.
3. Clone the repo, install dependencies, and fill in `server/.env` and `.env.local`.
4. Run `npm run build` then `pm2 start ecosystem.config.js`.
5. Configure Nginx to proxy traffic from port 80/443 → port 3000.
6. Obtain a free SSL certificate with Certbot (`certbot --nginx`).

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Coded1234/The-Fashion-Gallery.git
   cd The-Fashion-Gallery
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Create `.env` file in the `server` directory with the required variables.

4. **Create database**
   ```bash
   cd server
   npm run db:create
   ```

5. **Run development servers**
   
   Terminal 1 (Backend):
   ```bash
   npm run dev-server
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run dev-client
   ```

## Project Structure

```
├── app/                    # Next.js App Router (pages & layouts)
│   ├── layout.js           # Root layout
│   ├── page.js             # Home page
│   └── ...                 # Other routes
├── pages/
│   └── api/                # Next.js API routes (proxies to Express in production)
├── public/                 # Static assets
├── server/                 # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── scripts/
├── client/                 # Legacy Create React App (development reference)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── redux/
│       └── utils/
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── vercel.json             # Vercel deployment configuration
```

## API Documentation

Once deployed, access the API documentation at:
```
https://your-domain.vercel.app/api-docs
```

## License

ISC
