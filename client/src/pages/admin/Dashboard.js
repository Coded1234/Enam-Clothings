import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage,
  FiDollarSign,
  FiUsers,
  FiShoppingBag,
  FiTrendingUp,
  FiArrowUp,
  FiArrowDown,
  FiEye,
} from "react-icons/fi";
import { adminAPI } from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getDashboard();
      // Map backend response structure to frontend state
      const orderStatusMap = {};
      data.ordersByStatus?.forEach((item) => {
        orderStatusMap[item._id] = item.count;
      });

      setStats({
        totalRevenue: data.stats?.totalRevenue || 0,
        totalOrders: data.stats?.totalOrders || 0,
        totalProducts: data.stats?.totalProducts || 0,
        totalCustomers: data.stats?.totalCustomers || 0,
        revenueChange: parseFloat(data.stats?.revenueChange) || 0,
        ordersChange: 0,
        productsChange: 0,
        customersChange: 0,
        recentOrders: data.recentOrders || [],
        topProducts: data.topProducts || [],
        ordersByStatus: orderStatusMap,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
      // Set mock data for development
      setStats({
        totalRevenue: 2450000,
        totalOrders: 156,
        totalProducts: 89,
        totalCustomers: 1245,
        revenueChange: 12.5,
        ordersChange: 8.2,
        productsChange: 3.1,
        customersChange: 15.3,
        recentOrders: [],
        topProducts: [],
        ordersByStatus: {
          pending: 12,
          confirmed: 8,
          processing: 15,
          shipped: 20,
          delivered: 95,
          cancelled: 6,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      format: "currency",
      icon: FiDollarSign,
      color: "bg-green-500",
      change: stats?.revenueChange || 0,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: FiShoppingBag,
      color: "bg-blue-500",
      change: stats?.ordersChange || 0,
    },
    {
      title: "Products",
      value: stats?.totalProducts || 0,
      icon: FiPackage,
      color: "bg-purple-500",
      change: stats?.productsChange || 0,
    },
    {
      title: "Customers",
      value: stats?.totalCustomers || 0,
      icon: FiUsers,
      color: "bg-orange-500",
      change: stats?.customersChange || 0,
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-indigo-100 text-indigo-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <div className="text-xs sm:text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {error} (showing demo data)
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className={`p-2 md:p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="text-white" size={16} />
              </div>
              <div
                className={`flex items-center text-xs md:text-sm font-medium ${
                  stat.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change >= 0 ? (
                  <FiArrowUp size={12} />
                ) : (
                  <FiArrowDown size={12} />
                )}
                <span className="ml-1">{Math.abs(stat.change)}%</span>
              </div>
            </div>
            <h3 className="text-base md:text-2xl font-bold text-gray-800 truncate">
              {stat.format === "currency"
                ? formatCurrency(stat.value)
                : stat.value.toLocaleString()}
            </h3>
            <p className="text-xs md:text-base text-gray-500 truncate">
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              Orders by Status
            </h2>
            <Link
              to="/admin/orders"
              className="text-primary-600 hover:text-primary-700 text-xs md:text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {stats?.ordersByStatus &&
              Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="text-center p-2 md:p-4 rounded-lg bg-gray-50"
                >
                  <span
                    className={`inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )} mb-1 md:mb-2`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <p className="text-lg md:text-2xl font-bold text-gray-800">
                    {count}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <Link
              to="/admin/products/new"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 p-2 md:p-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <FiPackage size={16} className="md:w-5 md:h-5" />
              <span className="font-medium text-xs md:text-sm">
                Add Product
              </span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 p-2 md:p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FiShoppingBag size={16} className="md:w-5 md:h-5" />
              <span className="font-medium text-xs md:text-sm">
                View Orders
              </span>
            </Link>
            <Link
              to="/admin/customers"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 p-2 md:p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FiUsers size={16} className="md:w-5 md:h-5" />
              <span className="font-medium text-xs md:text-sm">Customers</span>
            </Link>
            <Link
              to="/admin/reviews"
              className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 p-2 md:p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FiTrendingUp size={16} className="md:w-5 md:h-5" />
              <span className="font-medium text-xs md:text-sm">Reviews</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-3 md:p-6 border-b">
          <h2 className="text-base md:text-lg font-bold text-gray-800">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-primary-600 hover:text-primary-700 text-xs md:text-sm font-medium"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="hidden sm:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="hidden sm:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {order.user?.firstName} {order.user?.lastName}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 font-medium">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span
                        className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEye size={16} className="md:w-[18px] md:h-[18px]" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-2 md:px-6 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500"
                  >
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
