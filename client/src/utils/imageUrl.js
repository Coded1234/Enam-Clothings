const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const USE_SAME_ORIGIN_API_UPLOADS = !/^https?:\/\//i.test(RAW_API_URL);

const getApiBase = () => {
  // Absolute API URL from env, e.g. https://api.example.com/api/v1
  if (/^https?:\/\//i.test(RAW_API_URL)) {
    return RAW_API_URL.replace(/\/api(?:\/v\d+)?\/?$/i, "");
  }

  // Relative API URL (e.g. /api/v1) should use the current origin in browser.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side fallback for local development.
  return "http://localhost:5000";
};

const API_BASE = getApiBase();

const extractImagePath = (imageUrlOrPath) => {
  if (!imageUrlOrPath) return "";

  if (typeof imageUrlOrPath === "object") {
    const publicId = imageUrlOrPath.publicId || imageUrlOrPath.public_id || "";
    const synthesizedLocalPath =
      publicId && !String(publicId).includes("/")
        ? `/uploads/products/${publicId}`
        : "";

    return (
      imageUrlOrPath.url ||
      imageUrlOrPath.path ||
      imageUrlOrPath.secure_url ||
      synthesizedLocalPath ||
      ""
    );
  }

  if (typeof imageUrlOrPath === "string") {
    return imageUrlOrPath;
  }

  return "";
};

/**
 * Get the full URL for an image
 * Handles both Cloudinary URLs and local storage paths
 */
export const getImageUrl = (imageUrlOrPath) => {
  let resolved = extractImagePath(imageUrlOrPath);

  if (!resolved) {
    return "/placeholder.jpg";
  }

  // Normalize Windows path separators and trim surrounding whitespace.
  resolved = resolved.trim().replace(/\\/g, "/");

  // If it's already a full URL (Cloudinary or external), return as is
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    if (USE_SAME_ORIGIN_API_UPLOADS) {
      try {
        const parsed = new URL(resolved);
        if (parsed.pathname.startsWith("/uploads")) {
          return `${API_BASE}/api${parsed.pathname}${parsed.search || ""}`;
        }
      } catch {
        // If URL parsing fails, keep original fallback behavior below.
      }
    }
    return resolved;
  }

  if (resolved.startsWith("data:") || resolved.startsWith("blob:")) {
    return resolved;
  }

  if (resolved.startsWith("//")) {
    return `https:${resolved}`;
  }

  // Handle relative uploads paths both with and without leading slash.
  if (resolved.startsWith("uploads/")) {
    resolved = `/${resolved}`;
  }

  // If it's a local path, prefix with backend URL
  if (resolved.startsWith("/uploads")) {
    if (USE_SAME_ORIGIN_API_UPLOADS) {
      return `${API_BASE}/api${resolved}`;
    }
    return `${API_BASE}${resolved}`;
  }

  // Default fallback
  return resolved;
};

/**
 * Get the first product image URL
 */
export const getProductImage = (product, index = 0) => {
  const image = product?.images?.[index];
  if (!image) return "/placeholder.jpg";
  return getImageUrl(image);
};
