const API_BASE =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

/**
 * Get the full URL for an image
 * Handles both Cloudinary URLs and local storage paths
 */
export const getImageUrl = (imageUrlOrPath) => {
  if (!imageUrlOrPath) return "/placeholder.jpg";

  // If it's an object with a url property, extract it
  if (typeof imageUrlOrPath === "object" && imageUrlOrPath.url) {
    imageUrlOrPath = imageUrlOrPath.url;
  }

  // Ensure it's a string
  if (typeof imageUrlOrPath !== "string") {
    return "/placeholder.jpg";
  }

  // If it's already a full URL (Cloudinary or external), return as is
  if (
    imageUrlOrPath.startsWith("http://") ||
    imageUrlOrPath.startsWith("https://")
  ) {
    return imageUrlOrPath;
  }

  // If it's a local path, prefix with backend URL
  if (imageUrlOrPath.startsWith("/uploads")) {
    return `${API_BASE}${imageUrlOrPath}`;
  }

  // Default fallback
  return imageUrlOrPath;
};

/**
 * Get the first product image URL
 */
export const getProductImage = (product, index = 0) => {
  const image = product?.images?.[index];
  if (!image) return "/placeholder.jpg";

  const url = typeof image === "string" ? image : image.url;
  return getImageUrl(url);
};
