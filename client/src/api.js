import axios from "axios";

// Use relative URL for Vercel deployment (API routes are at /api/*)
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // In browser, use relative path for same-domain API
    return "/api";
  }
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfTokenPromise = null;

const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get(`${getBaseURL()}/csrf-token`, { withCredentials: true })
      .then((res) => res.data.csrfToken)
      .catch((err) => null);
  }
  return csrfTokenPromise;
};

// Request interceptor to add CSRF and guest session headers
api.interceptors.request.use(
  async (config) => {
    // Add CSRF token for state-changing requests
    if (
      ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())
    ) {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }

    // Add Guest Session ID
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      // Create simple uuid-like string for fallbacks
      sessionId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("sessionId", sessionId);
    }
    config.headers["x-session-id"] = sessionId;

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
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
