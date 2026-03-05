/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In development, proxy /api/* to the local Express server.
    // In production on Vercel, api/[...path].js handles /api/* directly — no rewrite needed.
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  transpilePackages: [],
};

module.exports = nextConfig;
