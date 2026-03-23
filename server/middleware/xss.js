const xss = require("xss");

const clean = (data) => {
  if (typeof data === "string") {
    // Basic xss filter
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => clean(item));
  }
  if (typeof data === "object" && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = clean(data[key]);
    }
    return cleaned;
  }
  return data;
};

const xssMiddleware = () => {
  return (req, res, next) => {
    if (req.body) req.body = clean(req.body);
    if (req.query) req.query = clean(req.query);
    if (req.params) req.params = clean(req.params);
    next();
  };
};

module.exports = xssMiddleware;
