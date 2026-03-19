/**
 * Static Images Configuration
 *
 * This file contains all static images used throughout the website.
 * To change any image, simply update the URL here.
 *
 * You can use:
 * - External URLs (e.g., Unsplash, Cloudinary)
 * - Local paths (put images in /public/images/ folder and use "/images/filename.jpg")
 */

const IMAGES = {
  // ==========================================
  // HOME PAGE
  // ==========================================

  // Hero section background
  hero: {
    main: "/images/banners.jpg?w=1600",
  },

  // Category cards (Men, Women)
  categories: {
    men: "/images/men.jpg?w=500",
    women: "/images/women.jpg?w=500",
    perfumes: "/images/bestsellers.jpg?w=500",
  },

  // Rotating category card images (homepage)
  categorySlides: {
    men: [
      "/images/men.jpg?w=500",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500",
    ],
    women: [
      "/images/women.jpg?w=500",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=500",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500",
    ],
    perfumes: [
      "/images/bestsellers.jpg?w=500",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500",
    ],
  },

  // Trending section images
  trending: {
    small: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
    large1:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    large2: "/images/bestsellers.jpg?w=800",
  },

  // Instagram feed images
  instagram: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300",
    "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=300",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300",
    "/images/bestsellers.jpg?w=300",
  ],

  // ==========================================
  // AUTH PAGES
  // ==========================================

  // Login page side image
  login: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",

  // Register page side image
  register:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",

  // ==========================================
  // PLACEHOLDERS
  // ==========================================

  // Default placeholder for missing images
  placeholder: "/placeholder.jpg",

  // Default avatar for users without profile picture
  defaultAvatar: "/default-avatar.png",
};

export default IMAGES;
