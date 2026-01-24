import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiCheck,
  FiPrinter,
} from "react-icons/fi";
import { ordersAPI, adminAPI } from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await ordersAPI.getById(id);
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await adminAPI.updateOrderStatus(id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusStep = (status) => {
    const steps = ["pending", "confirmed", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link
          to="/admin/orders"
          className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs md:text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <FiPrinter size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-500">Status:</span>
            {order.status === "delivered" || order.status === "cancelled" ? (
              <span
                className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg border ${getStatusColor(
                  order.status,
                )}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            ) : (
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-lg border cursor-pointer ${getStatusColor(
                  order.status,
                )}`}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Status Locked Message */}
      {(order.status === "delivered" || order.status === "cancelled") && (
        <div
          className={`${
            order.status === "delivered"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          } border rounded-lg p-3 flex items-center gap-2 text-sm`}
        >
          <FiCheck
            className={
              order.status === "delivered" ? "text-green-600" : "text-red-600"
            }
          />
          <span>
            {order.status === "delivered"
              ? "This order has been delivered. Status is now locked."
              : "This order has been cancelled. Status is now locked."}
          </span>
        </div>
      )}

      {/* Order Progress */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6">
            Order Progress
          </h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
              />
            </div>
            {["pending", "confirmed", "shipped", "delivered"].map(
              (step, index) => {
                const isCompleted = getStatusStep(order.status) >= index;
                const isCurrent = order.status === step;
                return (
                  <div
                    key={step}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center z-10 ${
                        isCompleted
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      } ${isCurrent ? "ring-4 ring-primary-100" : ""}`}
                    >
                      {isCompleted ? (
                        <FiCheck size={14} className="md:w-4 md:h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium capitalize ${
                        isCompleted ? "text-primary-600" : "text-gray-500"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiPackage size={18} className="md:w-5 md:h-5" />
              Order Items
            </h2>
          </div>
          <div className="divide-y">
            {(order.items || order.orderItems)?.map((item) => (
              <div key={item.id} className="p-3 md:p-6 flex gap-3 md:gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage || item.product?.images?.[0] ? (
                    <img
                      src={getImageUrl(
                        item.productImage || item.product?.images?.[0],
                      )}
                      alt={item.productName || item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm md:text-base">
                    {item.productName || item.product?.name || "Product"}
                  </h3>
                  <div className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.size && item.color && <span className="mx-2">•</span>}
                    {item.color && (
                      <span className="flex items-center gap-1">
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
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 md:p-6 bg-gray-50 space-y-2 md:space-y-3">
            <div className="flex justify-between text-xs md:text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm text-gray-600">
              <span>Shipping</span>
              <span>
                {formatCurrency(order.shippingFee || order.shippingCost || 0)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs md:text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base md:text-lg font-bold text-gray-800 pt-2 md:pt-3 border-t">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-4 md:space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiUser size={18} className="md:w-5 md:h-5" />
              Customer
            </h2>
            <div className="space-y-2 md:space-y-3">
              <p className="font-medium text-gray-800 text-sm md:text-base">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p className="text-gray-600 text-xs md:text-sm">
                {order.user?.email}
              </p>
              <p className="text-gray-600 text-xs md:text-sm">
                {order.user?.phone}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiMapPin size={18} className="md:w-5 md:h-5" />
              Shipping Address
            </h2>
            <div className="space-y-2 text-gray-600 text-xs md:text-sm">
              <p>{order.shippingAddress?.address}</p>
              {order.shippingAddress?.addressDetails && (
                <p className="text-gray-700">{order.shippingAddress.addressDetails}</p>
              )}
              {order.shippingAddress?.phone && (
                <p>Phone: {order.shippingAddress?.phone}</p>
              )}
              {order.shippingAddress?.email && (
                <p>Email: {order.shippingAddress?.email}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiCreditCard size={18} className="md:w-5 md:h-5" />
              Payment
            </h2>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">Method</span>
                <span className="font-medium">
                  {order.paymentMethod === "cod"
                    ? "Pay on Delivery"
                    : "Paystack"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.paymentStatus || "pending"}
                </span>
              </div>
              {order.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-mono text-sm">
                    {order.paymentReference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
