import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not force a full redirect when the failed request is the login attempt itself.
      // This prevents the page from reloading on wrong credentials — the UI can show a toast instead.
      const reqUrl = error?.config?.url || "";
      const isLoginCall = reqUrl.includes("/auth/login");
      if (!isLoginCall) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (token) => api.post("/auth/google", { token }),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  toggleWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
  getWishlist: () => api.get("/auth/wishlist"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get("/products/featured"),
  getByCategory: (category, params) =>
    api.get(`/products/category/${category}`, { params }),
  getRelated: (id) => api.get(`/products/${id}/related`),
  search: (query) => api.get("/products/search", { params: { q: query } }),
  getCategories: () => api.get("/products/categories"),
};

// Cart API
export const cartAPI = {
  get: () => api.get("/cart"),
  add: (data) => api.post("/cart/add", data),
  update: (itemId, data) => api.put(`/cart/update/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clear: () => api.delete("/cart/clear"),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  track: (id) => api.get(`/orders/${id}/track`),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, params) =>
    api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post("/reviews", data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

// Payment API
export const paymentAPI = {
  initialize: (data) => api.post("/payment/initialize", data),
  verify: (reference) => api.get(`/payment/verify/${reference}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),

  // Products - handle both FormData and JSON
  createProduct: (data) => {
    if (data instanceof FormData) {
      return api.post("/admin/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/products", data);
  },
  updateProduct: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/admin/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/products/${id}`, data);
  },
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateStock: (id, data) => api.put(`/admin/products/${id}/stock`, data),
  deleteProductImage: (id, publicId) =>
    api.delete(`/admin/products/${id}/images/${publicId}`),

  // Orders
  getAllOrders: (params) => api.get("/admin/orders", { params }),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),

  // Customers
  getAllCustomers: (params) => api.get("/admin/customers", { params }),
  toggleCustomerStatus: (id) => api.put(`/admin/customers/${id}/toggle-status`),

  // Reviews
  getAllReviews: (params) => api.get("/admin/reviews", { params }),
  toggleReviewApproval: (id) => api.put(`/admin/reviews/${id}/approve`),

  // Reports
  getSalesReport: (params) => api.get("/admin/reports/sales", { params }),

  // Newsletter subscribers
  getSubscribers: (params) => api.get("/newsletter/subscribers", { params }),

  // Contact messages
  getContactMessages: (params) => api.get("/contact/messages", { params }),
  updateContactMessage: (id, data) => api.put(`/contact/messages/${id}`, data),
};

// Newsletter API
export const newsletterAPI = {
  subscribe: (email) => api.post("/newsletter/subscribe", { email }),
  unsubscribe: (email) => api.post("/newsletter/unsubscribe", { email }),
};

// Contact API
export const contactAPI = {
  submit: (data) => api.post("/contact", data),
};

export default api;
