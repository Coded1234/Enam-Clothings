# Enam Clothings - E-commerce Store

A full-stack e-commerce clothing store built with React, Node.js, Express, and PostgreSQL.

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
- React
- Redux Toolkit
- React Router
- Axios
- Tailwind CSS
- React Hot Toast

### Backend
- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Cloudinary (Image hosting)
- Nodemailer

## Deployment

### Vercel Deployment

1. **Prerequisites**
   - GitHub account with your code pushed
   - Vercel account
   - PostgreSQL database (e.g., Neon, Supabase, or Railway)
   - Cloudinary account for image hosting

2. **Environment Variables**

   Set up the following environment variables in your Vercel project settings:

   **Server Environment Variables:**
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=https://your-vercel-domain.vercel.app
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Paystack
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

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

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Coded1234/Enam-Clothings.git
   cd Enam-Clothings
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
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── redux/
│       └── utils/
├── server/                 # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── scripts/
└── vercel.json            # Vercel configuration
```

## API Documentation

Once deployed, access the API documentation at:
```
https://your-domain.vercel.app/api-docs
```

## License

ISC
