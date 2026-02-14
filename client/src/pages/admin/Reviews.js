import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiStar,
  FiCheck,
  FiX,
  FiEye,
  FiFilter,
} from "react-icons/fi";
import { adminAPI } from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(ratingFilter && { rating: ratingFilter }),
      };
      const { data } = await adminAPI.getAllReviews(params);
      setReviews(data.reviews || []);
      setTotalPages(data.pages || data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (reviewId, isApproved) => {
    try {
      setTogglingId(reviewId);
      await adminAPI.toggleReviewApproval(reviewId);
      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, isApproved: !isApproved } : r,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle approval:", err);
      alert("Failed to update review status");
    } finally {
      setTogglingId(null);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            className={
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      review.comment?.toLowerCase().includes(searchLower) ||
      review.user?.firstName?.toLowerCase().includes(searchLower) ||
      review.user?.lastName?.toLowerCase().includes(searchLower) ||
      review.product?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Reviews</h1>
        <span className="text-xs md:text-sm text-gray-500">
          {reviews.length} total reviews
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 relative">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2 flex-1 md:flex-initial">
              <FiFilter className="text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 md:flex-initial"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 md:flex-initial"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} Stars
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Product
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Review
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-2 md:py-4 hidden lg:table-cell">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {review.product?.images?.[0]?.url ||
                              review.product?.images?.[0] ? (
                                <img
                                  src={getImageUrl(
                                    review.product.images[0]?.url ||
                                      review.product.images[0],
                                  )}
                                  alt={review.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FiStar size={16} />
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <Link
                                to={`/admin/products/${review.productId}/edit`}
                                className="text-sm font-medium text-gray-900 hover:text-primary-600"
                              >
                                {review.product?.name || "Product"}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm text-gray-900">
                            {review.user?.firstName} {review.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {review.user?.email}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          {renderStars(review.rating)}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 hidden md:table-cell">
                          <p className="text-xs md:text-sm text-gray-600 max-w-xs truncate">
                            {review.comment || "No comment"}
                          </p>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden lg:table-cell">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap hidden sm:table-cell">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              review.isApproved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {review.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 md:gap-2">
                            <button
                              onClick={() => setSelectedReview(review)}
                              className="md:hidden p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleApproval(
                                  review.id,
                                  review.isApproved,
                                )
                              }
                              disabled={togglingId === review.id}
                              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                review.isApproved
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={review.isApproved ? "Reject" : "Approve"}
                            >
                              {togglingId === review.id ? (
                                <LoadingSpinner size="small" />
                              ) : review.isApproved ? (
                                <FiX
                                  size={16}
                                  className="md:w-[18px] md:h-[18px]"
                                />
                              ) : (
                                <FiCheck
                                  size={16}
                                  className="md:w-[18px] md:h-[18px]"
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No reviews found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs md:text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-800">
                Review Details
              </h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product */}
              {selectedReview.product && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Product</p>
                  <div className="flex items-center gap-3">
                    {selectedReview.product.images?.[0] && (
                      <img
                        src={getImageUrl(
                          selectedReview.product.images[0]?.url ||
                            selectedReview.product.images[0],
                        )}
                        alt={selectedReview.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {selectedReview.product.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Customer */}
              {selectedReview.user && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedReview.user.firstName}{" "}
                    {selectedReview.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedReview.user.email}
                  </p>
                </div>
              )}

              {/* Rating */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                {renderStars(selectedReview.rating)}
              </div>

              {/* Review */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Review</p>
                <p className="text-sm text-gray-700">
                  {selectedReview.comment || "No comment provided"}
                </p>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="text-sm text-gray-700">
                  {new Date(selectedReview.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    selectedReview.isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedReview.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  handleToggleApproval(
                    selectedReview.id,
                    selectedReview.isApproved,
                  );
                  setSelectedReview(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedReview.isApproved
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {selectedReview.isApproved ? "Reject" : "Approve"}
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
