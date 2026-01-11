// Vercel serverless function for all API routes
const app = require('../server/server.js');

module.exports = (req, res) => {
  // Remove /api prefix since Express routes don't have it
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '') || '/';
  }
  return app(req, res);
};
