import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductById,
  fetchRelatedProducts,
} from "../../redux/slices/productSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import ProductCard from "../../components/customer/ProductCard";
import SizeGuide from "../../components/customer/SizeGuide";
import { reviewsAPI, authAPI } from "../../utils/api";
import { getProductImage } from "../../utils/imageUrl";
import { addToRecentlyViewed } from "../../utils/recentlyViewed";
import toast from "react-hot-toast";
import {
  FiHeart,
  FiShare2,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiMinus,
  FiPlus,
  FiStar,
  FiChevronRight,
  FiCheck,
  FiThumbsUp,
} from "react-icons/fi";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { product, relatedProducts, loading } = useSelector(
    (state) => state.products,
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const { data } = await reviewsAPI.getProductReviews(id);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchRelatedProducts(id));
    fetchReviews();

    // Check if product is in wishlist
    if (isAuthenticated) {
      authAPI
        .getWishlist()
        .then(({ data }) => {
          const wishlistedIds = data.map((p) => p.id);
          setIsWishlisted(wishlistedIds.includes(id));
        })
        .catch((err) => console.error("Error fetching wishlist:", err));
    }

    window.scrollTo(0, 0);
  }, [dispatch, id, fetchReviews, isAuthenticated]);

  useEffect(() => {
    if (product?.sizes?.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    if (product?.colors?.length > 0) {
      // Handle both string colors (old format) and object colors (new format)
      const firstColor = product.colors[0];
      setSelectedColor(
        typeof firstColor === "string"
          ? { name: firstColor, code: "#000000" }
          : firstColor,
      );
    }

    // Save to recently viewed
    if (product && product.id) {
      addToRecentlyViewed(product);
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    try {
      await dispatch(
        addToCart({
          productId: id,
          quantity,
          size:
            typeof selectedSize === "string"
              ? selectedSize
              : selectedSize?.size,
          color: selectedColor,
        }),
      ).unwrap();
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(error || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      navigate("/login");
      return;
    }

    try {
      await authAPI.toggleWishlist(id);
      setIsWishlisted(!isWishlisted);
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      );
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error("Please login to mark reviews as helpful");
      navigate("/login");
      return;
    }

    try {
      const response = await reviewsAPI.markHelpful(reviewId);
      // Update the review in state locally for immediate feedback
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpful: response.data.review.helpful,
                isHelpfulByUser: response.data.isHelpful,
              }
            : review,
        ),
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error marking helpful:", error);
      toast.error("Failed to update helpful status");
    }
  };

  const getStockForSize = (size) => {
    if (!size || !product?.sizes) return 0;

    // Handle both string and object size formats
    const sizeValue = typeof size === "string" ? size : size.size;
    const sizeObj = product.sizes.find(
      (s) => (typeof s === "string" ? s : s.size) === sizeValue,
    );

    if (sizeObj && typeof sizeObj === "object" && sizeObj.stock !== undefined) {
      return sizeObj.stock;
    }

    // Fallback to total stock
    return product?.remainingStock ?? product?.totalStock ?? 0;
  };

  const selectedSizeStock = getStockForSize(selectedSize);
  const discountPercent = product?.comparePrice
    ? Math.round(
        ((Number(product.comparePrice) - Number(product.price)) /
          Number(product.comparePrice)) *
          100,
      )
    : 0;

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-gray-200 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-primary-500">
              Home
            </Link>
            <FiChevronRight size={14} />
            <Link to="/shop" className="hover:text-primary-500">
              Shop
            </Link>
            <FiChevronRight size={14} />
            <Link
              to={`/shop/${product.category}`}
              className="hover:text-primary-500 capitalize"
            >
              {product.category}
            </Link>
            <FiChevronRight size={14} />
            <span className="text-gray-800 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Product Main Section */}
        <div className="grid lg:grid-cols-[400px,1fr] gap-8 mb-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-xl overflow-hidden max-w-md">
              <img
                src={getProductImage(product, selectedImage)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? "border-primary-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={getProductImage(product, index)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Title */}
            <div>
              {product.brand && (
                <p className="text-primary-500 font-medium mb-2">
                  {product.brand}
                </p>
              )}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`${
                        i < Math.round(product.averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      size={18}
                    />
                  ))}
                  <span className="ml-2 text-gray-600">
                    {product.averageRating} ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                GH₵{Math.round(Number(product.price)).toLocaleString()}
              </span>
              {product.comparePrice && (
                <span className="text-base sm:text-lg md:text-xl text-gray-400 line-through">
                  GH₵{Math.round(Number(product.comparePrice)).toLocaleString()}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-green-600 font-medium">
                  Save GH₵
                  {Math.round(
                    Number(product.comparePrice) - Number(product.price),
                  ).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <p className="font-medium text-gray-800 mb-3">
                  Color:{" "}
                  <span className="text-gray-600">{selectedColor?.name}</span>
                </p>
                <div className="flex gap-3">
                  {product.colors.map((color) => {
                    const colorObj =
                      typeof color === "string"
                        ? { name: color, code: "#000000" }
                        : color;
                    return (
                      <button
                        key={colorObj.name}
                        onClick={() => setSelectedColor(colorObj)}
                        title={colorObj.name}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor?.name === colorObj.name
                            ? "ring-2 ring-offset-2 ring-primary-500"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: colorObj.code }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-800">
                    Size:{" "}
                    <span className="text-gray-600">
                      {typeof selectedSize === "string"
                        ? selectedSize
                        : selectedSize?.size}
                    </span>
                  </p>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-sm text-primary-500 hover:underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size, index) => {
                    const sizeValue =
                      typeof size === "string" ? size : size.size;
                    const sizeStock =
                      typeof size === "object" && size.stock !== undefined
                        ? size.stock
                        : (product.remainingStock ?? product.totalStock);
                    const selectedSizeValue =
                      typeof selectedSize === "string"
                        ? selectedSize
                        : selectedSize?.size;
                    const isSelected = selectedSizeValue === sizeValue;

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        disabled={sizeStock === 0}
                        className={`min-w-[48px] h-12 px-4 rounded-lg border font-medium transition-colors ${
                          isSelected
                            ? "bg-primary-500 text-white border-primary-500"
                            : sizeStock === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "hover:border-primary-500 hover:text-primary-500"
                        }`}
                      >
                        {sizeValue}
                      </button>
                    );
                  })}
                </div>
                {selectedSizeStock > 0 && selectedSizeStock <= 10 && (
                  <p className="text-orange-500 text-sm mt-2">
                    Only {selectedSizeStock} left in stock!
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="font-medium text-gray-800 mb-3">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 transition-colors"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(selectedSizeStock, quantity + 1))
                    }
                    disabled={quantity >= selectedSizeStock}
                    className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <FiPlus />
                  </button>
                </div>
                <span className="text-gray-500 text-sm">
                  {selectedSizeStock} available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={handleAddToCart}
                disabled={selectedSizeStock === 0}
                className="flex-1 py-2 sm:py-4 text-sm sm:text-base border-2 border-primary-500 text-primary-500 rounded-lg sm:rounded-xl font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={selectedSizeStock === 0}
                className="flex-1 py-2 sm:py-4 text-sm sm:text-base btn-gradient rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-2 sm:p-4 border-2 rounded-lg sm:rounded-xl transition-colors ${
                  isWishlisted
                    ? "bg-red-50 border-red-500 text-red-500"
                    : "border-gray-300 hover:border-red-500 hover:text-red-500"
                }`}
              >
                <FiHeart
                  className={isWishlisted ? "fill-red-500" : ""}
                  size={20}
                />
              </button>
              <button className="p-2 sm:p-4 border-2 border-gray-300 rounded-lg sm:rounded-xl hover:border-primary-500 hover:text-primary-500 transition-colors">
                <FiShare2 size={20} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <FiTruck className="mx-auto mb-2 text-primary-500" size={24} />
                <p className="text-sm text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <FiRefreshCw
                  className="mx-auto mb-2 text-primary-500"
                  size={24}
                />
                <p className="text-sm text-gray-600">Easy Returns</p>
              </div>
              <div className="text-center">
                <FiShield className="mx-auto mb-2 text-primary-500" size={24} />
                <p className="text-sm text-gray-600">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-sm mb-16">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex gap-8 px-6">
              {["description", "reviews", "shipping"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-primary-500 text-primary-500"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {tab}
                  {tab === "reviews" && ` (${reviews.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>

                {product.tags?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                {/* Header */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-6">
                  Verified Customer Feedback
                </h2>

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse p-4 border rounded-lg"
                      >
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No reviews yet. Be the first to review this product after
                      purchase!
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Content Grid */}
                    <div className="grid lg:grid-cols-[300px,1fr] gap-8">
                      {/* Left: Rating Summary */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="text-center mb-6">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            {(() => {
                              if (reviews.length === 0) return "0.0";
                              const avg =
                                reviews.reduce((sum, r) => sum + r.rating, 0) /
                                reviews.length;
                              return avg.toFixed(1);
                            })()}
                            /5
                          </div>
                          <div className="flex justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => {
                              const avg =
                                reviews.length > 0
                                  ? reviews.reduce(
                                      (sum, r) => sum + r.rating,
                                      0,
                                    ) / reviews.length
                                  : 0;
                              return (
                                <FiStar
                                  key={i}
                                  className={`${
                                    i < Math.round(avg)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  size={20}
                                />
                              );
                            })}
                          </div>
                          <p className="text-sm text-gray-600">
                            {reviews.length} verified rating
                            {reviews.length !== 1 ? "s" : ""}
                          </p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviews.filter(
                              (r) => r.rating === rating,
                            ).length;
                            const percentage =
                              reviews.length > 0
                                ? (count / reviews.length) * 100
                                : 0;

                            return (
                              <div
                                key={rating}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className="w-3 text-gray-700">
                                  {rating}
                                </span>
                                <FiStar
                                  className="text-yellow-400 fill-yellow-400"
                                  size={16}
                                />
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-10 text-gray-600 text-right">
                                  ({count})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Reviews List */}
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="pb-6 border-b last:border-0"
                          >
                            {/* Stars */}
                            <div className="flex gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`${
                                    i < review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  size={18}
                                />
                              ))}
                            </div>

                            {/* Title */}
                            {review.title && (
                              <h4 className="font-semibold text-gray-900 mb-3">
                                {review.title}
                              </h4>
                            )}

                            {/* Comment */}
                            <p className="text-gray-700 mb-4 leading-relaxed">
                              {review.comment}
                            </p>

                            {/* Meta Info */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  },
                                )}{" "}
                                by {review.user?.firstName || "Anonymous"}
                              </div>
                              {review.isVerifiedPurchase && (
                                <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                                  <FiCheck size={16} /> Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === "shipping" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Delivery Information
                  </h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Delivery: 1-2 business days</li>
                    <li>• Free shipping on orders over GH₵1,000</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Return Policy
                  </h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• 7-day return policy</li>
                    <li>• Items must be unworn with original tags</li>
                    <li>• Free returns on all orders</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gold-light mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      <SizeGuide
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        category={product?.category}
      />
    </div>
  );
};

export default ProductDetail;
