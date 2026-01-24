import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiMessageSquare,
  FiPrinter,
} from "react-icons/fi";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/orders/${id}`);
      // Backend returns the order object directly (not wrapped in { order })
      setOrder(data?.order || data);
    } catch (error) {
      toast.error("Failed to fetch order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

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

  const getStatusIcon = (status) => {
    const icons = {
      pending: FiClock,
      confirmed: FiRefreshCw,
      shipped: FiTruck,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
    };
    return icons[status] || FiPackage;
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
    { status: "pending", label: "Order Placed", icon: FiPackage },
    { status: "confirmed", label: "Confirmed", icon: FiRefreshCw },
    { status: "shipped", label: "Shipped", icon: FiTruck },
    { status: "delivered", label: "Delivered", icon: FiCheckCircle },
  ];

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

  const currentStepIndex = orderSteps.findIndex(
    (s) => s.status === status
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/orders")}
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
                <h1 className="text-2xl font-bold text-gray-800">
                  {order.orderNumber ||
                    `Order #${(orderId || "").slice(-8).toUpperCase()}`}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                    status
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiPrinter size={18} />
                Print
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <FiDownload size={18} />
                Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Progress */}
            {status !== "cancelled" && currentStepIndex >= 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6">
                  Order Progress
                </h2>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded">
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
                            className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${
                              isCompleted
                                ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            } ${
                              isCurrent
                                ? "ring-4 ring-primary-100 scale-110"
                                : ""
                            }`}
                          >
                            <StepIcon size={20} />
                          </div>
                          <p
                            className={`mt-3 text-sm font-medium ${
                              isCompleted ? "text-gray-800" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && status !== "delivered" && (
                            <p className="text-xs text-primary-500 mt-1">
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
                      {new Date(
                        new Date(order.createdAt).getTime() +
                          7 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString("en-GH", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
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

                  return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={getImageUrl(productImageUrl) || "/placeholder.jpg"}
                      alt={productName || "Product"}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="flex-1">
                      {productId ? (
                        <Link
                          to={`/product/${productId}`}
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
                  <span className="gradient-text">
                    {formatPrice(total)}
                  </span>
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
                    {paymentMethod === "cod"
                      ? "Pay on Delivery"
                      : "Paystack"}
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
                <p>
                  {order.shippingAddress?.city}
                </p>
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
    </div>
  );
};

export default OrderDetail;
