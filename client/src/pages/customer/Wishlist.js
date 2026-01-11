import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authAPI, cartAPI } from "../../utils/api";
import { getProductImage } from "../../utils/imageUrl";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import toast from "react-hot-toast";
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiShare2,
  FiGrid,
  FiList,
  FiStar,
  FiEye,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [removingId, setRemovingId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    fetchWishlist();
    // Load recently viewed
    const viewed = getRecentlyViewed();
    setRecentlyViewed(viewed.slice(0, 4));
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await authAPI.getWishlist();
      setWishlistItems(data || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      toast.error("Failed to load wishlist");
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setRemovingId(productId);
    try {
      await authAPI.toggleWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  const addToCart = async (product) => {
    setAddingToCartId(product.id);
    try {
      await cartAPI.add({
        productId: product.id,
        quantity: 1,
        size: product.sizes?.[0] || "M",
        color: product.colors?.[0] || null,
      });
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCartId(null);
    }
  };

  const moveAllToCart = async () => {
    for (const item of wishlistItems) {
      await addToCart(item);
    }
    toast.success("All items moved to cart!");
  };

  const clearWishlist = async () => {
    try {
      await authAPI.clearWishlist();
      setWishlistItems([]);
      localStorage.removeItem("wishlist");
      toast.success("Wishlist cleared");
    } catch (error) {
      setWishlistItems([]);
      localStorage.removeItem("wishlist");
      toast.success("Wishlist cleared");
    }
  };

  const shareWishlist = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Wishlist link copied to clipboard!");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 h-72"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FiHeart className="text-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-1">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""}{" "}
              saved
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white rounded-lg p-1 border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <FiGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <FiList size={18} />
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={shareWishlist}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiShare2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Clear All */}
              <button
                onClick={clearWishlist}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiTrash2 size={18} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
              <FiHeart className="text-red-300" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save items you love by clicking the heart icon on any product.
              They'll appear here for easy access later.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 btn-gradient rounded-xl font-semibold text-lg"
            >
              Explore Products
              <FiChevronRight />
            </Link>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600">
                Total value:{" "}
                <span className="font-bold text-gray-800">
                  {formatPrice(
                    wishlistItems.reduce((sum, item) => sum + item.price, 0)
                  )}
                </span>
              </p>
              <button
                onClick={moveAllToCart}
                className="flex items-center gap-2 px-6 py-3 btn-gradient rounded-xl font-semibold"
              >
                <FiShoppingCart />
                Move All to Cart
              </button>
            </div>

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Link to={`/product/${item.id}`}>
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {item.discount > 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                            -{item.discount}%
                          </span>
                        )}
                        {item.stock <= 5 && item.stock > 0 && (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                            Low Stock
                          </span>
                        )}
                        {item.stock === 0 && (
                          <span className="px-2 py-1 bg-gray-500 text-white text-xs font-semibold rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          disabled={removingId === item.id}
                          className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          {removingId === item.id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiX size={20} />
                          )}
                        </button>
                      </div>

                      {/* View Button */}
                      <Link
                        to={`/product/${item.id}`}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                      >
                        <FiEye size={16} />
                        Quick View
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <Link
                        to={`/product/${item.id}`}
                        className="font-semibold text-gray-800 hover:text-primary-500 transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1">
                        <FiStar
                          className="text-yellow-400 fill-yellow-400"
                          size={14}
                        />
                        <span className="text-sm text-gray-600">
                          {item.rating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({item.numReviews || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-gray-800">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice &&
                          item.originalPrice > item.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(item)}
                        disabled={
                          item.stock === 0 || addingToCartId === item.id
                        }
                        className={`w-full mt-3 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          item.stock === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "btn-gradient"
                        }`}
                      >
                        {addingToCartId === item.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <FiShoppingCart size={18} />
                            {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <Link to={`/product/${item.id}`} className="flex-shrink-0">
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        className="w-full sm:w-32 h-32 object-cover rounded-xl"
                      />
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            to={`/product/${item.id}`}
                            className="text-lg font-semibold text-gray-800 hover:text-primary-500 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          disabled={removingId === item.id}
                          className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                        >
                          {removingId === item.id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 size={20} />
                          )}
                        </button>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <FiStar
                            className="text-yellow-400 fill-yellow-400"
                            size={14}
                          />
                          <span className="text-sm text-gray-600">
                            {item.rating?.toFixed(1) || "0.0"} (
                            {item.numReviews || 0} reviews)
                          </span>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            item.stock > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {item.stock > 0
                            ? `${item.stock} in stock`
                            : "Out of stock"}
                        </span>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-800">
                            {formatPrice(item.price)}
                          </span>
                          {item.originalPrice &&
                            item.originalPrice > item.price && (
                              <>
                                <span className="text-gray-400 line-through">
                                  {formatPrice(item.originalPrice)}
                                </span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-medium rounded">
                                  -{item.discount}%
                                </span>
                              </>
                            )}
                        </div>

                        <button
                          onClick={() => addToCart(item)}
                          disabled={
                            item.stock === 0 || addingToCartId === item.id
                          }
                          className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                            item.stock === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "btn-gradient"
                          }`}
                        >
                          {addingToCartId === item.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <FiShoppingCart size={18} />
                              {item.stock === 0
                                ? "Out of Stock"
                                : "Add to Cart"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  You Also Viewed
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {recentlyViewed.map((product) => {
                    const images = Array.isArray(product.images)
                      ? product.images
                      : [];
                    const imageUrl =
                      images.length > 0
                        ? images[0].startsWith("http")
                          ? images[0]
                          : `${
                              process.env.REACT_APP_API_URL ||
                              "http://localhost:5000"
                            }${images[0]}`
                        : "/placeholder.jpg";
                    const price = parseFloat(product.price) || 0;
                    const salePrice = parseFloat(product.salePrice) || 0;
                    const hasDiscount = salePrice > 0 && salePrice < price;

                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                            {product.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            {hasDiscount ? (
                              <>
                                <span className="font-bold text-primary-600">
                                  GH₵{salePrice.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  GH₵{price.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-800">
                                GH₵{price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
