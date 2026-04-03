/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https:;",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
          },
        ],
      },
    ];
  },
  // Explicitly include pg in Vercel lambda — sequelize loads it dynamically
  // and the file tracer can't detect dynamic require(dialectModule) calls.
  outputFileTracingRoot: path.join(__dirname, "./"),
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/pg/**/*",
      "./node_modules/pg-hstore/**/*",
      "./node_modules/pg-connection-string/**/*",
    ],
  },
  async rewrites() {
    // In development, proxy /api/* to the local Express server.
    // In production on Vercel, api/[...path].js handles /api/* directly — no rewrite needed.
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:5000/api/:path*",
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  transpilePackages: [],
  webpack: (config) => {
    // IMPORTANT: This repo embeds components from ./client/src inside Next.
    // Those files would otherwise resolve dependencies from ./client/node_modules,
    // which can create duplicate package instances and break React context.
    // Example symptom: "Google OAuth components must be used within GoogleOAuthProvider".
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-oauth/google": path.resolve(
        __dirname,
        "node_modules/@react-oauth/google",
      ),
      "react-hot-toast": path.resolve(
        __dirname,
        "node_modules/react-hot-toast",
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
