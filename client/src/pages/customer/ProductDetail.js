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
import { getProductImage, getImageUrl } from "../../utils/imageUrl";
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
    (state) => state.products
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
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
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
          : firstColor
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
          size: selectedSize,
          color: selectedColor,
        })
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
        isWishlisted ? "Removed from wishlist" : "Added to wishlist"
      );
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to write a review");
      navigate("/login");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewsAPI.create({
        productId: id,
        ...reviewForm,
      });
      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, title: "", comment: "" });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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
            : review
        )
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error marking helpful:", error);
      toast.error("Failed to update helpful status");
    }
  };

  const getStockForSize = (size) => {
    return product?.remainingStock ?? product?.totalStock ?? 0;
  };

  const selectedSizeStock = getStockForSize(selectedSize);
  const discountPercent = product?.comparePrice
    ? Math.round(
        ((Number(product.comparePrice) - Number(product.price)) /
          Number(product.comparePrice)) *
          100
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
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden">
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
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
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
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
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
              <span className="text-3xl font-bold text-gray-900">
                ₦{Number(product.price).toLocaleString()}
              </span>
              {product.comparePrice && (
                <span className="text-xl text-gray-400 line-through">
                  ₦{Number(product.comparePrice).toLocaleString()}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-green-600 font-medium">
                  Save ₦
                  {(
                    Number(product.comparePrice) - Number(product.price)
                  ).toLocaleString()}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description?.substring(0, 200)}...
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
                    Size: <span className="text-gray-600">{selectedSize}</span>
                  </p>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-sm text-primary-500 hover:underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={
                        (product.remainingStock ?? product.totalStock) === 0
                      }
                      className={`min-w-[48px] h-12 px-4 rounded-lg border font-medium transition-colors ${
                        selectedSize === size
                          ? "bg-primary-500 text-white border-primary-500"
                          : (product.remainingStock ?? product.totalStock) === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "hover:border-primary-500 hover:text-primary-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
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
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={selectedSizeStock === 0}
                className="flex-1 py-4 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={selectedSizeStock === 0}
                className="flex-1 py-4 btn-gradient rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-4 border-2 rounded-xl transition-colors ${
                  isWishlisted
                    ? "bg-red-50 border-red-500 text-red-500"
                    : "border-gray-300 hover:border-red-500 hover:text-red-500"
                }`}
              >
                <FiHeart
                  className={isWishlisted ? "fill-red-500" : ""}
                  size={24}
                />
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

            {/* Share */}
            <div className="flex items-center gap-4 pt-4">
              <span className="text-gray-600">Share:</span>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <FiShare2 />
              </button>
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
                {/* Review Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-gray-800 mb-2">
                      {product.averageRating || 0}
                    </div>
                    <div className="flex justify-center md:justify-start gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`${
                            i < Math.round(product.averageRating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                          size={20}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      {product.reviewCount} reviews
                    </p>
                  </div>
                </div>

                {/* Write Review Form */}
                {isAuthenticated && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Write a Review
                    </h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setReviewForm({ ...reviewForm, rating: star })
                              }
                              className="p-1"
                            >
                              <FiStar
                                size={28}
                                className={`${
                                  star <= reviewForm.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Review Title
                        </label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              title: e.target.value,
                            })
                          }
                          placeholder="Sum up your review"
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              comment: e.target.value,
                            })
                          }
                          rows={4}
                          placeholder="What did you like or dislike about this product?"
                          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
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
                      No reviews yet. Be the first to review!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="pb-6 border-b last:border-0"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                                {review.user?.firstName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {review.user?.firstName}{" "}
                                  {review.user?.lastName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <FiStar
                                        key={i}
                                        size={14}
                                        className={`${
                                          i < review.rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {review.isVerifiedPurchase && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <FiCheck size={12} /> Verified Purchase
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {review.title && (
                          <h4 className="font-medium text-gray-800 mb-2">
                            {review.title}
                          </h4>
                        )}
                        <p className="text-gray-600 mb-4">{review.comment}</p>

                        <button
                          onClick={() => handleMarkHelpful(review.id)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            review.isHelpfulByUser
                              ? "text-primary-500 font-medium"
                              : "text-gray-500 hover:text-primary-500"
                          }`}
                        >
                          <FiThumbsUp
                            size={14}
                            className={
                              review.isHelpfulByUser ? "fill-current" : ""
                            }
                          />
                          {review.isHelpfulByUser ? "Helpful" : "Helpful"} (
                          {review.helpful || 0})
                        </button>
                      </div>
                    ))}
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
                    <li>• Standard delivery: 3-5 business days</li>
                    <li>• Express delivery: 1-2 business days</li>
                    <li>• Free shipping on orders over GH₵50,000</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Return Policy
                  </h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• 30-day return policy</li>
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
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
