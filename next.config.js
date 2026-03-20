/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Explicitly include pg in Vercel lambda — sequelize loads it dynamically
  // and the file tracer can't detect dynamic require(dialectModule) calls.
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
          destination: "http://localhost:5000/api/:path*",
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
