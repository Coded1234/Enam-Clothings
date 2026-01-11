// Recently Viewed Products - localStorage utility

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
