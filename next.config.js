/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Explicitly include pg in Vercel lambda — sequelize loads it dynamically
    // and the file tracer can't detect dynamic require(dialectModule) calls.
    outputFileTracingIncludes: {
      "/api/**": [
        "./node_modules/pg/**/*",
        "./node_modules/pg-hstore/**/*",
        "./node_modules/pg-connection-string/**/*",
      ],
    },
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
};

module.exports = nextConfig;
