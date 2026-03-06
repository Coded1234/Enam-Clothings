"use client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiPrinter,
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

  const handlePrint = () => {
    const addr = order.shippingAddress || {};
    const orderNum =
      order.orderNumber || `#${(orderId || "").slice(-8).toUpperCase()}`;
    const placedDate = formatDate(order.createdAt);
    const placedTime = formatTime(order.createdAt);

    const itemRows = items
      .map((item) => {
        const name = item.product?.name || item.productName || "—";
        const size = item.size ? `Size: ${item.size}` : "";
        const color = item.color
          ? `Color: ${typeof item.color === "object" ? item.color.name : item.color}`
          : "";
        const meta = [size, color].filter(Boolean).join(" · ");
        const qty = item.quantity || 1;
        const unit = parseFloat(item.price ?? 0) || 0;
        const line = unit * qty;
        return `
        <tr>
          <td>${name}${meta ? `<br/><small style="color:#888">${meta}</small>` : ""}</td>
          <td style="text-align:center">${qty}</td>
          <td style="text-align:right">GH₵${unit.toFixed(2)}</td>
          <td style="text-align:right">GH₵${line.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    const payLabel = paymentMethod === "cod" ? "Pay on Delivery" : "Paystack";
    const payStatusLabel = isPaid ? "PAID" : "PENDING";
    const payStatusColor = isPaid ? "#16a34a" : "#d97706";

    const logoUrl = `${window.location.origin}/images/loginlogo.png`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Delivery Receipt – ${orderNum}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Open Sans', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 40px; max-width: 720px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
    .brand img { height: 48px; width: auto; object-fit: contain; display: block; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .receipt-label { text-align: right; }
    .receipt-label h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-label p { font-size: 11px; color: #666; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
    .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
    .meta-box p { font-size: 13px; line-height: 1.6; color: #111; }
    .meta-box .highlight { font-weight: 700; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #111; color: #fff; }
    thead th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 10px 12px; vertical-align: top; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .totals { width: 280px; margin-left: auto; margin-bottom: 24px; }
    .totals tr td { padding: 5px 0; font-size: 13px; }
    .totals tr td:last-child { text-align: right; font-weight: 600; }
    .totals .total-row td { border-top: 2px solid #111; padding-top: 10px; font-size: 16px; font-weight: 700; }
    .discount-row td { color: #16a34a; }
    .pay-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; border: 1.5px solid; }
    .barcode-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px; }
    .order-id-box { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 2px; color: #111; }
    .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    .watermark { position: fixed; pointer-events: none; z-index: 0; }
    .watermark img { width: 200px; height: auto; filter: grayscale(100%); opacity: 0.58; }
    .wm-top { top: 10%; left: 10%; transform: rotate(-20deg); }
    .wm-top-right { top: 10%; right: 10%; transform: rotate(20deg); }
    .wm-center { top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); }
    .wm-bottom-left { bottom: 10%; left: 10%; transform: rotate(20deg); }
    .wm-bottom { bottom: 10%; right: 10%; transform: rotate(-20deg); }
    @media print {
      body { padding: 16px 20px; }
      .no-print { display: none; }
      .watermark { position: fixed; }
    }
  </style>
</head>
<body>
  <div class="watermark wm-top"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-top-right"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-center"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-bottom-left"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-bottom"><img src="${logoUrl}" alt="" /></div>
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="Diamond Vogue Gallery" />
      <div class="brand-sub">Premium Fashion &amp; Clothing · Accra, Ghana</div>
    </div>
    <div class="receipt-label">
      <h2>Delivery Receipt</h2>
      <p>${placedDate}</p>
      <p>${placedTime}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Order Details</h4>
      <p class="highlight">${orderNum}</p>
      <p style="margin-top:6px">Payment: ${payLabel}</p>
    </div>
    <div class="meta-box">
      <h4>Deliver To</h4>
      <p class="highlight">${addr.firstName || ""} ${addr.lastName || ""}</p>
      <p>${addr.address || ""}</p>
      ${addr.addressDetails ? `<p>${addr.addressDetails}</p>` : ""}
      <p>${addr.city || ""}${addr.country ? `, ${addr.country}` : ""}</p>
      ${addr.phone ? `<p>📞 ${addr.phone}</p>` : ""}
      ${addr.email ? `<p>✉ ${addr.email}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td>GH₵${subtotal.toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td>${shippingFee === 0 ? "FREE" : `GH₵${shippingFee.toFixed(2)}`}</td></tr>
    ${discount > 0 ? `<tr class="discount-row"><td>Discount</td><td>-GH₵${discount.toFixed(2)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>Tax</td><td>GH₵${tax.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td>GH₵${total.toFixed(2)}</td></tr>
  </table>

  <div class="barcode-row">
    <div>
      <div class="order-id-box">${orderNum}</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:4px">Scan or quote this ID for enquiries</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6b7280">
      <p>Items: ${items.length} &nbsp;·&nbsp; Qty: ${items.reduce((s, i) => s + (i.quantity || 1), 0)}</p>
      <p>Printed: ${new Date().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" })}</p>
    </div>
  </div>

  <div class="footer">
    <span>Diamond Vogue Gallery · Accra, Ghana</span>
    <span>Thank you for your order!</span>
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=780,height=900");
    win.document.write(html);
    win.document.close();
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
                <button
                  onClick={handlePrint}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Print Receipt"
                >
                  <FiPrinter size={18} />
                </button>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <FiCalendar size={16} />
                Placed on {formatDate(order.createdAt)} at{" "}
                {formatTime(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

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

                {/* Estimated Delivery */}
                {status !== "delivered" && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Estimated Delivery:</strong>{" "}
                      {(() => {
                        const orderDate = new Date(order.createdAt);
                        const day = orderDate.getDay(); // 0 = Sunday, 6 = Saturday
                        const hour = orderDate.getHours();

                        let deliveryDate = new Date(orderDate);

                        // Weekend logic (Saturday = 6, Sunday = 0)
                        if (day === 0 || day === 6) {
                          // Orders between 12am and 2pm on weekends → same day
                          if (hour < 14) {
                            // Same day delivery
                            deliveryDate = orderDate;
                          } else {
                            // After 2pm → next day
                            deliveryDate.setDate(orderDate.getDate() + 1);
                          }
                        } else {
                          // Weekdays → next day delivery
                          deliveryDate.setDate(orderDate.getDate() + 1);
                        }

                        return deliveryDate.toLocaleDateString("en-GH", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        });
                      })()}
                    </p>
                  </div>
                )}
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
                            {item.size && (
                              <span className="px-2 py-0.5 bg-white rounded">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="px-2 py-0.5 bg-white rounded flex items-center gap-1">
                                Color:
                                {item.color?.code && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: item.color.code }}
                                  ></span>
                                )}
                                {typeof item.color === "object"
                                  ? item.color.name
                                  : item.color}
                              </span>
                            )}
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
                    {paymentMethod === "cod" ? "Pay on Delivery" : "Paystack"}
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
