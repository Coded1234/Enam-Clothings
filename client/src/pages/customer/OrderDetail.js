"use client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import { isGreaterAccra } from "../../utils/deliveryRegion";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCalendar,
  FiRefreshCw,
  FiStar,
  FiX,
} from "react-icons/fi";

const OrderDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState({});

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/orders/${id}`);
      // Backend returns the order object directly (not wrapped in { order })
      const fetchedOrder = data?.order || data;
      setOrder(fetchedOrder);

      // Fetch reviews for each product if order is delivered
      if (
        fetchedOrder.status === "delivered" &&
        fetchedOrder.items?.length > 0
      ) {
        const reviews = {};
        for (const item of fetchedOrder.items) {
          const productId = item.product?.id || item.product?._id;
          if (productId) {
            try {
              const { data: reviewsData } = await api.get(
                `/reviews/product/${productId}`,
              );
              // Check if current user has already reviewed this product
              const userReview = reviewsData?.reviews?.find(
                (review) => review.user?.id === fetchedOrder.userId,
              );
              if (userReview) {
                reviews[productId] = userReview;
              }
            } catch (error) {
              console.error("Error fetching reviews:", error);
            }
          }
        }
        setProductReviews(reviews);
      }
    } catch (error) {
      toast.error("Failed to fetch order details");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-500 bg-yellow-50",
      confirmed: "text-blue-500 bg-blue-50",
      shipped: "text-purple-500 bg-purple-50",
      delivered: "text-green-500 bg-green-50",
      cancelled: "text-red-500 bg-red-50",
    };
    return colors[status] || "text-gray-500 bg-gray-50";
  };

  const orderSteps = [
    { status: "confirmed", label: "Confirmed", icon: FiRefreshCw },
    { status: "shipped", label: "Shipped", icon: FiTruck },
    { status: "delivered", label: "Delivered", icon: FiCheckCircle },
  ];

  const getDeliveredDate = (order) => {
    if (!order) return null;
    if (order.deliveredAt) return new Date(order.deliveredAt);

    const history = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];
    const deliveredEntry = history
      .slice()
      .reverse()
      .find((h) => (h?.status || "").toLowerCase() === "delivered");
    if (deliveredEntry?.date) return new Date(deliveredEntry.date);

    return null;
  };

  const getReturnEligibility = (order) => {
    const deliveredDate = getDeliveredDate(order);
    if (!deliveredDate || Number.isNaN(deliveredDate.getTime())) {
      return { eligible: false, daysRemaining: null, deliveredDate: null };
    }

    const returnWindowDays = 2; // Reduced to 2 days
    const now = new Date();
    const diffMs = now.getTime() - deliveredDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, returnWindowDays - diffDays);
    const eligible = diffDays >= 0 && diffDays <= returnWindowDays;

    return { eligible, daysRemaining, deliveredDate };
  };

  const handleReviewClick = (item) => {
    const productId = item.product?.id || item.product?._id;
    const productName = item.product?.name || item.productName;
    const productImages = item.product?.images || [];
    const firstImage = productImages?.[0];
    const productImageUrl =
      item.productImage ||
      (typeof firstImage === "string" ? firstImage : firstImage?.url);

    setSelectedProduct({
      id: productId,
      name: productName,
      image: productImageUrl,
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!reviewData.comment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        productId: selectedProduct.id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
      });

      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
      setReviewData({ rating: 5, title: "", comment: "" });

      // Refresh order to update review status
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedProduct(null);
    setReviewData({ rating: 5, title: "", comment: "" });
  };

  const isPerfumeItem = (item) => {
    const category =
      item?.product?.category || item?.productCategory || item?.category;
    return String(category || "").toLowerCase() === "perfumes";
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="bg-white rounded-2xl p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const orderId = order.id || order._id;
  const status = order.status || order.orderStatus;
  const items = order.items || order.orderItems || [];

  const { eligible: isReturnEligible, daysRemaining } =
    getReturnEligibility(order);
  const returnHref = `/contact?subject=${encodeURIComponent(
    "Returns & Exchanges",
  )}&orderId=${encodeURIComponent(orderId || "")}&orderNumber=${encodeURIComponent(
    order.orderNumber || `Order #${(orderId || "").slice(-8).toUpperCase()}`,
  )}`;

  const subtotal = parseFloat(order.subtotal ?? order.itemsPrice ?? 0) || 0;
  const shippingFee =
    parseFloat(order.shippingFee ?? order.shippingPrice ?? 0) || 0;
  const tax = parseFloat(order.taxPrice ?? order.tax ?? 0) || 0;
  const discount = parseFloat(order.discount ?? 0) || 0;
  const total = parseFloat(order.totalAmount ?? order.totalPrice ?? 0) || 0;

  const paymentMethod = order.paymentMethod;
  const paymentStatus =
    order.paymentStatus || (order.isPaid ? "paid" : "pending");
  const isPaid = paymentStatus === "paid";

  const currentStepIndex = orderSteps.findIndex((s) => s.status === status);

  const returnStatus = String(order.returnApprovalStatus || "")
    .toLowerCase()
    .trim();
  const hasReturnRequest = Boolean(order.returnRequestedAt);
  const returnStatusLabel =
    returnStatus === "approved"
      ? "Approved"
      : returnStatus === "not_approved"
        ? "Not approved"
        : returnStatus === "pending"
          ? "Pending"
          : hasReturnRequest
            ? "Pending"
            : "";
  const returnStatusClass =
    returnStatus === "approved"
      ? "text-green-600"
      : returnStatus === "not_approved"
        ? "text-red-600"
        : "text-yellow-700";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FiArrowLeft />
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xs sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 break-all">
                  {order.orderNumber ||
                    `Order #${(orderId || "").slice(-8).toUpperCase()}`}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                    status,
                  )}`}
                >
                  {status}
                </span>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <FiCalendar size={16} />
                Placed on {formatDate(order.createdAt)} at{" "}
                {formatTime(order.createdAt)}
              </p>
            </div>

            {status === "delivered" && (
              <div className="text-right">
                {isReturnEligible ? (
                  <div className="inline-flex flex-col items-end">
                    {hasReturnRequest ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg opacity-60 cursor-not-allowed"
                        title="Return request already submitted"
                      >
                        <FiRefreshCw size={16} />
                        Request Return
                      </button>
                    ) : (
                      <Link
                        href={returnHref}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <FiRefreshCw size={16} />
                        Request Return
                      </Link>
                    )}
                    {hasReturnRequest && returnStatusLabel && (
                      <p className={`text-xs mt-1 ${returnStatusClass}`}>
                        Return: {returnStatusLabel}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                      title="Returns are available within 14 days of delivery"
                    >
                      <FiRefreshCw size={16} />
                      Request Return
                    </button>
                    {hasReturnRequest && returnStatusLabel && (
                      <p className={`text-xs mt-1 ${returnStatusClass}`}>
                        Return: {returnStatusLabel}
                      </p>
                    )}
                    {typeof daysRemaining === "number" &&
                      daysRemaining === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Return window expired
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expected Delivery - show for all non-delivered, non-cancelled orders (including pending) */}
        {status !== "cancelled" && status !== "delivered" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
            <FiCalendar className="text-blue-600 shrink-0" size={22} />
            <p className="text-sm text-blue-800">
              <strong>Expected delivery:</strong>{" "}
              {isGreaterAccra(order.shippingAddress)
                ? (() => {
                    const orderDate = new Date(order.createdAt);
                    const day = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
                    const hour = orderDate.getHours();
                    let deliveryDate = new Date(orderDate);
                    const isWeekend = day === 0 || day === 6;
                    if (isWeekend) {
                      if (hour < 6 || hour >= 12) {
                        deliveryDate.setDate(orderDate.getDate() + 1);
                      }
                    } else {
                      if (hour >= 6 && hour < 18) {
                        deliveryDate.setDate(orderDate.getDate() + 1);
                      } else if (hour >= 18) {
                        deliveryDate.setDate(orderDate.getDate() + 1);
                      }
                    }
                    return deliveryDate.toLocaleDateString("en-GH", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    });
                  })()
                : "Within 3 to 5 business days"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Progress */}
            {status !== "cancelled" && currentStepIndex >= 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-6">
                  Order Progress
                </h2>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 rounded">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded transition-all duration-500"
                      style={{
                        width: `${
                          (currentStepIndex / (orderSteps.length - 1)) * 100
                        }%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {orderSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.status}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                              isCompleted
                                ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            } ${
                              isCurrent
                                ? "ring-3 ring-primary-100 scale-110"
                                : ""
                            }`}
                          >
                            <StepIcon size={16} />
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium ${
                              isCompleted ? "text-gray-800" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && status !== "delivered" && (
                            <p className="text-[10px] text-primary-500 mt-0.5">
                              In Progress
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Cancelled Notice */}
            {status === "cancelled" && (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <FiXCircle className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-1">
                      Order Cancelled
                    </h3>
                    <p className="text-red-600">
                      This order has been cancelled. If you have any questions,
                      please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Order Items ({items?.length || 0})
              </h2>
              <div className="space-y-4">
                {items?.map((item, index) => {
                  const productId = item.product?.id || item.product?._id;
                  const productName = item.product?.name || item.productName;

                  const productImages = item.product?.images || [];
                  const firstImage = productImages?.[0];
                  const productImageUrl =
                    item.productImage ||
                    (typeof firstImage === "string"
                      ? firstImage
                      : firstImage?.url);

                  const unitPrice = parseFloat(item.price ?? 0) || 0;
                  const qty = item.quantity || 0;

                  const hasReviewed = productId && productReviews[productId];

                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex gap-4">
                        <img
                          src={
                            getImageUrl(productImageUrl) || "/placeholder.jpg"
                          }
                          alt={productName || "Product"}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="flex-1">
                          {productId ? (
                            <Link
                              href={`/product/${productId}`}
                              className="font-semibold text-gray-800 hover:text-primary-500 transition-colors"
                            >
                              {productName}
                            </Link>
                          ) : (
                            <p className="font-semibold text-gray-800">
                              {productName}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            {!isPerfumeItem(item) && item.size && (
                              <span className="px-2 py-0.5 bg-white rounded">
                                Size: {item.size}
                              </span>
                            )}
                            {!isPerfumeItem(item) &&
                              item.color &&
                              (() => {
                                const colorName =
                                  typeof item.color === "object"
                                    ? item.color?.name
                                    : item.color;
                                const colorCode =
                                  typeof item.color === "object"
                                    ? item.color?.code
                                    : null;
                                if (!colorName && !colorCode) return null;
                                return (
                                  <span className="px-2 py-0.5 bg-white rounded flex items-center gap-1">
                                    Color:
                                    {colorCode && (
                                      <span
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: colorCode }}
                                      ></span>
                                    )}
                                    {colorName}
                                  </span>
                                );
                              })()}
                            <span className="px-2 py-0.5 bg-white rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {formatPrice(unitPrice * qty)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(unitPrice)} each
                          </p>
                        </div>
                      </div>

                      {/* Review Button for Delivered Orders */}
                      {status === "delivered" && productId && (
                        <div className="mt-4 pt-4 border-t">
                          {hasReviewed ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-600">
                                <FiCheckCircle size={18} />
                                <span className="text-sm font-medium">
                                  You reviewed this product
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar
                                    key={i}
                                    size={14}
                                    className={
                                      i < productReviews[productId].rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleReviewClick(item)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-all"
                            >
                              <FiStar size={18} />
                              <span className="font-medium">
                                Write a Review
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-green-500">FREE</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="gradient-text">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiCreditCard className="text-primary-500" />
                Payment
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium text-gray-800">
                    {paymentMethod === "paystack"
                      ? "Paystack"
                      : "Online Payment"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-medium ${
                      isPaid ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {isPaid ? "Paid" : "Pending"}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid On</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(order.paidAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiMapPin className="text-primary-500" />
                Shipping Address
              </h2>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium text-gray-800">
                  {order.shippingAddress?.firstName}{" "}
                  {order.shippingAddress?.lastName}
                </p>
                <p>{order.shippingAddress?.address}</p>
                {order.shippingAddress?.addressDetails && (
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.addressDetails}
                  </p>
                )}
                <p>{order.shippingAddress?.city}</p>
                <p>{order.shippingAddress?.country}</p>
                {(order.shippingAddress?.postalCode ||
                  order.shippingAddress?.zipCode) && (
                  <p>
                    {order.shippingAddress?.postalCode ||
                      order.shippingAddress?.zipCode}
                  </p>
                )}
                <div className="pt-3 border-t mt-3 space-y-1">
                  <p className="flex items-center gap-2">
                    <FiPhone size={14} />
                    {order.shippingAddress?.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiMail size={14} />
                    {order.shippingAddress?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                Write a Review
              </h3>
              <button
                onClick={closeReviewModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Product Info */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(selectedProduct.image) || "/placeholder.jpg"}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                <div>
                  <p className="font-semibold text-gray-800">
                    {selectedProduct.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Share your experience with this product
                  </p>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewData({ ...reviewData, rating: star })
                      }
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      <FiStar
                        size={32}
                        className={
                          star <= reviewData.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-semibold text-gray-700">
                    {reviewData.rating}{" "}
                    {reviewData.rating === 1 ? "Star" : "Stars"}
                  </span>
                </div>
              </div>

              {/* Title (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, title: e.target.value })
                  }
                  placeholder="Sum up your experience"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-black text-black bg-white"
                  maxLength={200}
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  placeholder="Tell others about your experience with this product..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-black text-black bg-white"
                  rows={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 10 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submittingReview || reviewData.comment.length < 10}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
