// Recently Viewed Products - localStorage utility
import { productsAPI } from "./api";

const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 10;

// Get all recently viewed products
export const getRecentlyViewed = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading recently viewed:", error);
    return [];
  }
};

// Add a product to recently viewed
export const addToRecentlyViewed = (product) => {
  if (!product || !product.id) return;

  try {
    const viewed = getRecentlyViewed();

    // Remove if already exists (to move to front)
    const filtered = viewed.filter((p) => p.id !== product.id);

    // Create minimal product data to store
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || product.sale_price,
      images: product.images
        ? typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images
        : [],
      category: product.category,
      viewedAt: new Date().toISOString(),
    };

    // Add to front of array
    filtered.unshift(productData);

    // Keep only MAX_ITEMS
    const limited = filtered.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Error saving to recently viewed:", error);
  }
};

// Clear all recently viewed
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing recently viewed:", error);
  }
};

// Remove a specific product from recently viewed
export const removeFromRecentlyViewed = (productId) => {
  try {
    const viewed = getRecentlyViewed();
    const filtered = viewed.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from recently viewed:", error);
  }
};

// Return only products that still exist; prune deleted items from storage.
export const getValidRecentlyViewed = async () => {
  const viewed = getRecentlyViewed();
  if (!viewed.length) return [];

  const checks = await Promise.allSettled(
    viewed.map(async (product) => {
      try {
        await productsAPI.getById(product.id);
        return product;
      } catch (error) {
        // Product no longer exists or is inaccessible: remove from cache.
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 400
        ) {
          return null;
        }

        // On transient network/server errors, keep cached item for now.
        return product;
      }
    }),
  );

  const valid = checks
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter(Boolean);

  if (valid.length !== viewed.length) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch (error) {
      console.error("Error pruning recently viewed:", error);
    }
  }

  return valid;
};
