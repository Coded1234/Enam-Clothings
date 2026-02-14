import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiShoppingBag,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

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
    return icons[status] || FiPackage;
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

  // Filter and search orders
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((item) =>
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-40"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Dropdown */}
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
                className="pl-11 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white min-w-[160px]"
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              No orders found
            </h2>
            <p className="text-gray-600 mb-6">
              {filter !== "all"
                ? `You don't have any ${filter} orders`
                : "You haven't placed any orders yet"}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gradient rounded-xl font-semibold"
            >
              Start Shopping
              <FiChevronRight />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          <StatusIcon size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Order ID</p>
                          <p className="font-bold text-gray-800">
                            #{order.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-800 flex items-center gap-1">
                            <FiCalendar size={14} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-bold text-gray-800">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <Link
                    to={`/orders/${order.id}`}
                    className="block p-4 md:p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Product Images */}
                        <div className="flex -space-x-3 flex-shrink-0">
                          {order.items?.slice(0, 4).map((item, index) => (
                            <img
                              key={index}
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-white object-cover"
                            />
                          ))}
                          {order.items?.length > 4 && (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-600">
                            {getTotalQuantity(order.items)} item(s)
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                            {order.items?.[0]?.product?.name ||
                              order.items?.[0]?.productName}
                            {order.items?.length > 1 && " and more..."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              cancelOrder(order.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                          >
                            <FiXCircle size={18} />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}
                        <FiChevronRight className="text-gray-400" size={20} />
                      </div>
                    </div>
                  </Link>

                  {/* Order Progress */}
                  <div className="px-4 md:px-6 pb-4">
                    {order.status === "cancelled" ? (
                      // Cancelled order progress
                      <div>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="flex-1 h-1 rounded bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100" />
                          <div className="flex-1 h-1 rounded bg-gray-200" />
                          <div className="w-3 h-3 rounded-full bg-gray-200" />
                          <div className="flex-1 h-1 rounded bg-gray-200" />
                          <div className="w-3 h-3 rounded-full bg-gray-200" />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>Pending</span>
                          <span className="text-red-500 font-medium">
                            Cancelled
                          </span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    ) : (
                      // Normal order progress
                      <div>
                        <div className="flex items-center gap-2 pt-4">
                          {["pending", "confirmed", "shipped", "delivered"].map(
                            (step, index) => {
                              const steps = [
                                "pending",
                                "confirmed",
                                "shipped",
                                "delivered",
                              ];
                              const currentIndex = steps.indexOf(order.status);
                              const isCompleted = index <= currentIndex;
                              const isCurrent = index === currentIndex;

                              return (
                                <React.Fragment key={step}>
                                  <div
                                    className={`w-3 h-3 rounded-full transition-all ${
                                      isCompleted
                                        ? "bg-primary-500"
                                        : "bg-gray-200"
                                    } ${
                                      isCurrent ? "ring-4 ring-primary-100" : ""
                                    }`}
                                  />
                                  {index < 3 && (
                                    <div
                                      className={`flex-1 h-1 rounded ${
                                        index < currentIndex
                                          ? "bg-primary-500"
                                          : "bg-gray-200"
                                      }`}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            },
                          )}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>Pending</span>
                          <span>Confirmed</span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-primary-500 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
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
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Order Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Orders",
                value: orders.length,
                color: "bg-blue-500",
              },
              {
                label: "Delivered",
                value: orders.filter((o) => o.status === "delivered").length,
                color: "bg-green-500",
              },
              {
                label: "In Progress",
                value: orders.filter((o) =>
                  ["pending", "confirmed", "shipped"].includes(o.status),
                ).length,
                color: "bg-yellow-500",
              },
              {
                label: "Total Spent",
                value: formatPrice(
                  orders
                    .filter((o) => o.status !== "cancelled")
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                ),
                color: "bg-purple-500",
                isPrice: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full ${stat.color} mb-2`}
                ></div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
