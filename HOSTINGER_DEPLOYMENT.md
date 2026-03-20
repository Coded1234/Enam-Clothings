# Hostinger Deployment Guide

This guide explains how to host the Diamond Aura Gallery on **Hostinger VPS** (e.g., KVM 1 or higher).

> **Shared Web Hosting vs VPS**
>
> Hostinger's standard **shared web hosting** plans are designed for PHP/WordPress sites and do **not** support running a persistent Node.js process. Use a **Hostinger VPS** (KVM) plan to host this application.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Hostinger KVM VPS (≥ 1 vCPU, ≥ 2 GB RAM) | KVM 1 is sufficient for a small store |
| Ubuntu 22.04 / 24.04 (recommended OS) | Select when provisioning the VPS |
| A domain name | Can be purchased through Hostinger or elsewhere |
| Cloudinary account | Free tier is enough for images |
| Paystack account | For payment processing |
| Gmail account + App Password | For transactional email (see [EMAIL_VERIFICATION_SETUP.md](./EMAIL_VERIFICATION_SETUP.md)) |

---

## Step 1 — Provision the VPS

1. Log in to [hPanel](https://hpanel.hostinger.com).
2. Go to **VPS** → **Create New VPS**.
3. Choose at least the **KVM 1** plan.
4. Select **Ubuntu 22.04** as the operating system.
5. After the VPS is ready, note the **IP address** and **root password** from hPanel.

---

## Step 2 — Connect & Secure the Server

```bash
# Connect as root
ssh root@<YOUR_VPS_IP>

# Update system packages
apt update && apt upgrade -y

# Create a non-root deploy user (replace "deploy" with your preferred username)
adduser deploy
usermod -aG sudo deploy

# Switch to the new user for the rest of the setup
su - deploy
```

---

## Step 3 — Install Node.js

```bash
# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # should be 20.x
npm -v    # should be 10.x or higher
```

---

## Step 4 — Install PostgreSQL

You can either install PostgreSQL locally on the VPS **or** use a managed database (Neon, Supabase, Railway). A managed database is simpler and recommended for beginners.

### Option A — Local PostgreSQL (on the VPS)

```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database and user
sudo -u postgres psql <<'SQL'
CREATE USER fashionuser WITH PASSWORD 'your_strong_password';
CREATE DATABASE fashiondb OWNER fashionuser;
GRANT ALL PRIVILEGES ON DATABASE fashiondb TO fashionuser;
SQL
```

> **Password tip:** Use a randomly generated password of at least 16 characters containing uppercase, lowercase, numbers, and symbols (e.g. run `openssl rand -base64 24` on the server to generate one).

Your `DATABASE_URL` will be:
```
DATABASE_URL=postgresql://fashionuser:your_strong_password@localhost:5432/fashiondb
```

### Option B — Managed Database (Neon / Supabase / Railway)

Create a free PostgreSQL database at [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) and copy the connection string they provide.

---

## Step 5 — Install PM2 & Nginx

```bash
# PM2 — production process manager for Node.js
sudo npm install -g pm2

# Nginx — web server / reverse proxy
sudo apt install -y nginx
```

---

## Step 6 — Deploy the Application

```bash
# Clone the repository (replace the URL if you have forked the project)
cd /home/deploy
git clone https://github.com/Coded1234/The-Fashion-Gallery.git
cd The-Fashion-Gallery

# Install all dependencies (root + server)
npm install
cd server && npm install && cd ..
```

---

## Step 7 — Configure Environment Variables

Create the server `.env` file:

```bash
nano server/.env
```

Paste and fill in all required variables:

```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://fashionuser:your_strong_password@localhost:5432/fashiondb

# JWT
JWT_SECRET=your_very_long_random_secret_key
JWT_EXPIRE=7d

# Frontend URL (your actual domain)
CLIENT_URL=https://yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=diamondauragallery@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=diamondauragallery@gmail.com

# Paystack
# Use sk_test_/pk_test_ keys during initial setup and testing.
# Only switch to sk_live_/pk_live_ keys once you have verified everything works.
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# Optional — Google / Facebook OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Optional — Yango Delivery
YANGO_API_URL=https://b2b.yango.com/api/b2b
YANGO_API_KEY=your_yango_api_key
YANGO_CLIENT_ID=your_yango_client_id
STORE_LATITUDE=5.6037
STORE_LONGITUDE=-0.1870
STORE_ADDRESS=Accra, Ghana
```

Create the Next.js root `.env.local` file:

```bash
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## Step 8 — Create the Database Schema

```bash
cd /home/deploy/The-Fashion-Gallery
node server/scripts/createDatabase.js
```

---

## Step 9 — Build the Application

```bash
npm run build
```

This compiles the Next.js frontend and prepares the serverless API handlers that proxy to Express in production.

---

## Step 10 — Start the App with PM2

The project includes a ready-made PM2 configuration (`ecosystem.config.js`) at the repository root.

```bash
# Start the application
pm2 start ecosystem.config.js

# Check that it is running
pm2 status

# View live logs
pm2 logs fashion-gallery

# Configure PM2 to restart automatically after a reboot
pm2 save
pm2 startup
# Run the command that pm2 startup prints (it will look like: sudo env PATH=... pm2 startup ...)
```

The Next.js server now listens on **port 3000**.

---

## Step 11 — Configure Nginx as a Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/fashion-gallery
```

Paste the following (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload size limit for product images
    client_max_body_size 10M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fashion-gallery /etc/nginx/sites-enabled/
sudo nginx -t          # test configuration
sudo systemctl reload nginx
```

---

## Step 12 — Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install the certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update the Nginx config to redirect HTTP → HTTPS.
# Certificates auto-renew via the systemd timer installed by Certbot.
```

---

## Step 13 — Point Your Domain to the VPS

In your domain registrar (or in Hostinger's hPanel under **Domains**):

| Record | Host | Value |
|--------|------|-------|
| A | `@` | `<YOUR_VPS_IP>` |
| A | `www` | `<YOUR_VPS_IP>` |

DNS propagation typically takes 5–30 minutes.

---

## Updating the Application

```bash
cd /home/deploy/The-Fashion-Gallery

# Pull the latest code
git pull origin main

# Re-install dependencies (if package.json changed)
npm install
cd server && npm install && cd ..

# Rebuild
npm run build

# Reload PM2 (zero-downtime)
pm2 reload fashion-gallery
```

---

## Useful Commands

| Task | Command |
|------|---------|
| Check app status | `pm2 status` |
| View logs | `pm2 logs fashion-gallery` |
| Restart app | `pm2 restart fashion-gallery` |
| Stop app | `pm2 stop fashion-gallery` |
| Check Nginx status | `sudo systemctl status nginx` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Renew SSL certificate | `sudo certbot renew --dry-run` |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 502 Bad Gateway | App not running on port 3000 | Run `pm2 status` and `pm2 logs` |
| Database connection error | Wrong `DATABASE_URL` or PostgreSQL not running | Check `server/.env` and `sudo systemctl status postgresql` |
| Images not loading | Cloudinary credentials missing | Verify `CLOUDINARY_*` variables in `server/.env` |
| Emails not sending | Wrong Gmail credentials or App Password | See [EMAIL_VERIFICATION_SETUP.md](./EMAIL_VERIFICATION_SETUP.md) |
| Build fails with out-of-memory | VPS RAM too low | Increase swap space: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
