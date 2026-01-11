import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
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
      setOrder(data.order);
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
      processing: FiRefreshCw,
      shipped: FiTruck,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
    };
    return icons[status] || FiPackage;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-500 bg-yellow-50",
      processing: "text-blue-500 bg-blue-50",
      shipped: "text-purple-500 bg-purple-50",
      delivered: "text-green-500 bg-green-50",
      cancelled: "text-red-500 bg-red-50",
    };
    return colors[status] || "text-gray-500 bg-gray-50";
  };

  const orderSteps = [
    { status: "pending", label: "Order Placed", icon: FiPackage },
    { status: "processing", label: "Processing", icon: FiRefreshCw },
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

  const StatusIcon = getStatusIcon(order.orderStatus);
  const currentStepIndex = orderSteps.findIndex(
    (s) => s.status === order.orderStatus
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
                  Order #{order._id.slice(-8).toUpperCase()}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus}
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
            {order.orderStatus !== "cancelled" && (
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
                          {isCurrent && order.orderStatus !== "delivered" && (
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
                {order.orderStatus !== "delivered" && (
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
            {order.orderStatus === "cancelled" && (
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
                Order Items ({order.orderItems?.length})
              </h2>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={item.product?.images?.[0]?.url || "/placeholder.jpg"}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.product?._id}`}
                        className="font-semibold text-gray-800 hover:text-primary-500 transition-colors"
                      >
                        {item.product?.name}
                      </Link>
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
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Need Help?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <FiMessageSquare className="text-primary-500" size={24} />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Contact Support</p>
                    <p className="text-sm text-gray-500">
                      Get help with your order
                    </p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <FiRefreshCw className="text-primary-500" size={24} />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">
                      Return or Exchange
                    </p>
                    <p className="text-sm text-gray-500">
                      Start a return request
                    </p>
                  </div>
                </button>
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
                  <span>{formatPrice(order.itemsPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shippingPrice === 0 ? (
                      <span className="text-green-500">FREE</span>
                    ) : (
                      formatPrice(order.shippingPrice)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(order.taxPrice)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="gradient-text">
                    {formatPrice(order.totalPrice)}
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
                    {order.paymentMethod === "cod"
                      ? "Pay on Delivery"
                      : "Paystack"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-medium ${
                      order.isPaid ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Pending"}
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
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
                <p>{order.shippingAddress?.country}</p>
                {order.shippingAddress?.zipCode && (
                  <p>{order.shippingAddress?.zipCode}</p>
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
