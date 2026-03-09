"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString("en-GH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          {error} (showing demo data)
        </div>
      )}

      {/* Stats Cards */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-3 md:grid md:grid-cols-4 w-max md:w-full">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="w-40 md:w-auto bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 flex-shrink-0"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="text-white" size={17} />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${stat.change >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stat.change >= 0 ? (
                    <FiArrowUp size={11} />
                  ) : (
                    <FiArrowDown size={11} />
                  )}
                  {Math.abs(stat.change)}%
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                  {stat.title}
                </p>
                <p className="text-sm font-bold text-gray-800 leading-tight truncate">
                  {stat.format === "currency"
                    ? formatCurrency(stat.value)
                    : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders by Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">
              Orders by Status
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-primary-600 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.ordersByStatus &&
              Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                >
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(status)}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                href: "/admin/products/new",
                icon: FiPackage,
                label: "Add Product",
                bg: "bg-violet-50",
                text: "text-violet-700",
                border: "border-violet-100",
                iconBg: "bg-violet-500",
              },
              {
                href: "/admin/orders",
                icon: FiShoppingBag,
                label: "View Orders",
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-100",
                iconBg: "bg-blue-500",
              },
              {
                href: "/admin/customers",
                icon: FiUsers,
                label: "Customers",
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-100",
                iconBg: "bg-emerald-500",
              },
              {
                href: "/admin/reviews",
                icon: FiTrendingUp,
                label: "Reviews",
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-100",
                iconBg: "bg-amber-500",
              },
            ].map(({ href, icon: Icon, label, bg, text, border, iconBg }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 p-3 rounded-xl border ${bg} ${border} hover:opacity-80 transition-opacity`}
              >
                <div
                  className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={16} />
                </div>
                <span className={`font-semibold text-xs ${text}`}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders — cards on mobile, table on desktop */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs text-primary-600 font-medium"
          >
            View All
          </Link>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-gray-100">
          {stats?.recentOrders?.length > 0 ? (
            stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                  <p className="text-xs font-bold text-gray-800 w-16 text-right">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-primary-600 ml-1"
                  >
                    <FiEye size={15} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-gray-400 py-8">
              No recent orders
            </p>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Order ID", "Customer", "Amount", "Status", "Date", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.user?.firstName} {order.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FiEye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-sm text-gray-400"
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
