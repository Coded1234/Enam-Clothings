"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const handleCardClick = (orderId) => {
    if (typeof window === "undefined") return;
    router.push(`/orders/${orderId}`);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/orders");
      setOrders(data.orders || []);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await api.put(`/orders/${orderId}/cancel`, {
        reason: "Cancelled by customer",
      });
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

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

  const isReturnEligible = (order) => {
    const deliveredDate = getDeliveredDate(order);
    if (!deliveredDate || Number.isNaN(deliveredDate.getTime())) return false;

    const returnWindowDays = 2; // Reduced to 2 days
    const diffMs = new Date().getTime() - deliveredDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= returnWindowDays;
  };

  const getTotalQuantity = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: FiClock,
      confirmed: FiCheckCircle,
      shipped: FiTruck,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
    };
    return icons[status] || FiClock;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      shipped: "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const filterOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      (order.orderNumber || "").toLowerCase().includes(q) ||
      (order.id || "").toLowerCase().includes(q) ||
      order.items?.some((item) =>
        (item.productName || "").toLowerCase().includes(q),
      );
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-surface rounded-2xl p-6 h-40 border border-gray-100 dark:border-white/10"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gold-light mb-2">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-primary-300">
            Track and manage your orders
          </p>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by order ID, order number, or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white placeholder-black dark:placeholder-black bg-white dark:bg-white/[0.03]"
              />
            </div>

            <div className="relative">
              <FiFilter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 pr-8 py-3 border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-white/[0.03] w-full md:min-w-[170px] text-gray-900 dark:text-white"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-white/10">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gold-light mb-2">
              No orders found
            </h2>
            <p className="text-gray-600 dark:text-primary-300 mb-6">
              {filter !== "all"
                ? `You don't have any ${filter} orders`
                : "You haven't placed any orders yet"}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gradient rounded-xl font-semibold"
            >
              Start Shopping
              <FiChevronRight />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const orderDisplayNumber =
                order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`;
              const firstItemName =
                order.items?.[0]?.product?.name ||
                order.items?.[0]?.productName;
              const extraCount = Math.max(0, (order.items?.length || 0) - 1);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-surface rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-white/10 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(order.id)}
                >
                  <div className="px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 p-2 rounded-xl ${getStatusColor(order.status)}`}
                        >
                          <StatusIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 dark:text-gold-light text-sm truncate">
                            {orderDisplayNumber}
                          </p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-gray-500 dark:text-primary-300">
                              Placed {formatDate(order.createdAt)}
                            </p>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-gold-light">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-white/[0.03] border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-3 flex-shrink-0">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <img
                              key={index}
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-white dark:border-surface object-cover"
                            />
                          ))}
                          {order.items?.length > 3 && (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-white dark:border-surface bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-white/80">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gold-light truncate">
                            {firstItemName || "Order items"}
                            {extraCount > 0 ? ` +${extraCount} more` : ""}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-primary-300 mt-1">
                            {getTotalQuantity(order.items)} item(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {order.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              cancelOrder(order.id);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-white/5 rounded-lg transition-colors font-medium text-sm"
                          >
                            <FiXCircle size={18} />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}

                        {order.status === "delivered" &&
                          isReturnEligible(order) && (
                            <div className="flex flex-col items-end">
                              <button
                                disabled={Boolean(order.returnRequestedAt)}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (order.returnRequestedAt) return;
                                  const returnHref = `/contact?subject=${encodeURIComponent(
                                    "Returns & Exchanges",
                                  )}&orderId=${encodeURIComponent(
                                    order.id,
                                  )}&orderNumber=${encodeURIComponent(
                                    order.orderNumber ||
                                      `Order #${order.id.slice(-8).toUpperCase()}`,
                                  )}`;
                                  router.push(returnHref);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-white/5 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                                title={
                                  order.returnRequestedAt
                                    ? "Return request already submitted"
                                    : undefined
                                }
                              >
                                <FiRefreshCw size={18} />
                                <span className="hidden sm:inline">
                                  Request Return
                                </span>
                              </button>
                              {order.returnRequestedAt && (
                                <p
                                  className={`text-[11px] mt-1 ${
                                    String(order.returnApprovalStatus || "")
                                      .toLowerCase()
                                      .trim() === "approved"
                                      ? "text-green-600"
                                      : String(order.returnApprovalStatus || "")
                                            .toLowerCase()
                                            .trim() === "not_approved"
                                        ? "text-red-600"
                                        : "text-yellow-700"
                                  }`}
                                >
                                  {(() => {
                                    const s = String(
                                      order.returnApprovalStatus || "pending",
                                    )
                                      .toLowerCase()
                                      .trim();
                                    const label =
                                      s === "approved"
                                        ? "Approved"
                                        : s === "not_approved"
                                          ? "Not approved"
                                          : "Pending";
                                    return `Return: ${label}`;
                                  })()}
                                </p>
                              )}
                            </div>
                          )}

                        <Link
                          href={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <FiEye size={18} />
                          <span className="hidden sm:inline">View</span>
                          <FiChevronRight className="text-gray-400" size={18} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 text-sm rounded-lg font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-primary-500 text-white"
                      : "border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
