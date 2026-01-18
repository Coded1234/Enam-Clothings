import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { reviewsAPI } from "../../utils/api";
import { FiStar, FiChevronLeft, FiThumbsUp, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { fetchProductById } from "../../redux/slices/productSlice";

const ProductReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { product } = useSelector((state) => state.products);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [ratingFilter, setRatingFilter] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await reviewsAPI.getProductReviews(id, {
        sort: sortBy,
        limit: 100,
      });
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [id, sortBy]);

  useEffect(() => {
    dispatch(fetchProductById(id));
    fetchReviews();
  }, [dispatch, id, fetchReviews]);

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error("Please login to mark reviews as helpful");
      navigate("/login");
      return;
    }

    try {
      await reviewsAPI.markReviewHelpful(reviewId);

      // Update the review in the list
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpful: review.isHelpfulByUser
                  ? review.helpful - 1
                  : review.helpful + 1,
                isHelpfulByUser: !review.isHelpfulByUser,
              }
            : review,
        ),
      );
    } catch (error) {
      toast.error("Failed to mark review as helpful");
    }
  };

  const filteredReviews = ratingFilter
    ? reviews.filter((r) => r.rating === ratingFilter)
    : reviews;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          to={`/product/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <FiChevronLeft />
          Back to Product
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Customer Reviews
          </h1>

          {product && (
            <div className="flex items-center gap-4 pb-4 border-b">
              <img
                src={product.images?.[0]?.url || "/placeholder.png"}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-medium text-gray-800">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        size={14}
                        className={`${
                          i < Math.round(product.averageRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.averageRating?.toFixed(1)} ({reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rating Distribution */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">
                Rating Breakdown
              </h4>
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count }) => (
                  <button
                    key={rating}
                    onClick={() =>
                      setRatingFilter(ratingFilter === rating ? null : rating)
                    }
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      ratingFilter === rating
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Sort By</h4>
              <div className="space-y-2">
                {[
                  { value: "newest", label: "Most Recent" },
                  { value: "rating-high", label: "Highest Rating" },
                  { value: "rating-low", label: "Lowest Rating" },
                  { value: "helpful", label: "Most Helpful" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      sortBy === option.value
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {ratingFilter
                  ? `No ${ratingFilter}-star reviews found`
                  : "No reviews yet"}
              </p>
              {ratingFilter && (
                <button
                  onClick={() => setRatingFilter(null)}
                  className="mt-4 text-primary-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="pb-6 border-b last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                          {review.user?.firstName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {review.user?.firstName} {review.user?.lastName}
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
                      className={review.isHelpfulByUser ? "fill-current" : ""}
                    />
                    Helpful ({review.helpful || 0})
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
