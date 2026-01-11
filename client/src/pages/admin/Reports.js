import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
} from "react-icons/fi";
import { adminAPI } from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { range: dateRange };
      if (dateRange === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const { data } = await adminAPI.getSalesReport(params);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      // Set mock data for demo
      setReportData({
        summary: {
          totalRevenue: 2450000,
          totalOrders: 156,
          averageOrderValue: 15705,
          totalItemsSold: 423,
        },
        revenueByDay: [
          { date: "2026-01-05", revenue: 125000, orders: 8 },
          { date: "2026-01-06", revenue: 180000, orders: 12 },
          { date: "2026-01-07", revenue: 95000, orders: 6 },
          { date: "2026-01-08", revenue: 220000, orders: 15 },
          { date: "2026-01-09", revenue: 310000, orders: 21 },
          { date: "2026-01-10", revenue: 175000, orders: 11 },
          { date: "2026-01-11", revenue: 285000, orders: 18 },
        ],
        topProducts: [
          { name: "Premium Cotton T-Shirt", sold: 45, revenue: 675000 },
          { name: "Slim Fit Jeans", sold: 38, revenue: 760000 },
          { name: "Casual Sneakers", sold: 32, revenue: 640000 },
          { name: "Summer Dress", sold: 28, revenue: 420000 },
          { name: "Leather Belt", sold: 25, revenue: 125000 },
        ],
        categoryBreakdown: [
          { category: "Men", orders: 68, revenue: 1020000 },
          { category: "Women", orders: 52, revenue: 780000 },
          { category: "Kids", orders: 24, revenue: 360000 },
        ],
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

  const handleCustomDateSubmit = () => {
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const exportReport = () => {
    // Create CSV content
    let csv = "Sales Report\n\n";
    csv += "Summary\n";
    csv += `Total Revenue,${reportData?.summary?.totalRevenue || 0}\n`;
    csv += `Total Orders,${reportData?.summary?.totalOrders || 0}\n`;
    csv += `Average Order Value,${
      reportData?.summary?.averageOrderValue || 0
    }\n`;
    csv += `Total Items Sold,${reportData?.summary?.totalItemsSold || 0}\n\n`;

    csv += "Top Products\n";
    csv += "Product,Sold,Revenue\n";
    reportData?.topProducts?.forEach((p) => {
      csv += `${p.name},${p.sold},${p.revenue}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Sales Reports
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            View and analyze your sales performance
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FiRefreshCw size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <FiDownload size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" size={16} />
            <span className="text-xs md:text-sm font-medium text-gray-700">
              Date Range:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "quarter", label: "This Quarter" },
              { value: "year", label: "This Year" },
              { value: "custom", label: "Custom" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  dateRange === option.value
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {dateRange === "custom" && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleCustomDateSubmit}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="text-green-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <FiTrendingUp className="text-green-500 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-gray-500 text-xs md:text-sm">Total Revenue</p>
          <p className="text-lg md:text-2xl font-bold text-gray-800">
            {formatCurrency(reportData?.summary?.totalRevenue || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <FiShoppingBag className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">Total Orders</p>
          <p className="text-lg md:text-2xl font-bold text-gray-800">
            {reportData?.summary?.totalOrders || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
              <FiBarChart2 className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">
            Average Order Value
          </p>
          <p className="text-lg md:text-2xl font-bold text-gray-800">
            {formatCurrency(reportData?.summary?.averageOrderValue || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
              <FiShoppingBag className="text-orange-600 w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">Items Sold</p>
          <p className="text-lg md:text-2xl font-bold text-gray-800">
            {reportData?.summary?.totalItemsSold || 0}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">
            Revenue Over Time
          </h3>
          <div className="space-y-3 md:space-y-4">
            {reportData?.revenueByDay?.map((day, index) => (
              <div key={index} className="flex items-center gap-2 md:gap-4">
                <span className="text-xs md:text-sm text-gray-500 w-16 md:w-24">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 md:h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-end pr-1 md:pr-2"
                    style={{
                      width: `${
                        (day.revenue /
                          Math.max(
                            ...reportData.revenueByDay.map((d) => d.revenue)
                          )) *
                        100
                      }%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium hidden md:inline">
                      {formatCurrency(day.revenue)}
                    </span>
                  </div>
                </div>
                <span className="text-xs md:text-sm text-gray-600 w-12 md:w-16 text-right">
                  {day.orders} <span className="hidden md:inline">orders</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">
            Top Selling Products
          </h3>
          <div className="space-y-3 md:space-y-4">
            {reportData?.topProducts?.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <span
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-400"
                        : "bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 text-xs md:text-sm">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">{product.sold} sold</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800 text-xs md:text-sm">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">
            Sales by Category
          </h3>
          <div className="space-y-3 md:space-y-4">
            {reportData?.categoryBreakdown?.map((cat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    {cat.category}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500">
                    {cat.orders}{" "}
                    <span className="hidden sm:inline">orders</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 md:h-3 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: `${
                          (cat.revenue /
                            Math.max(
                              ...reportData.categoryBreakdown.map(
                                (c) => c.revenue
                              )
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-800 w-20 md:w-28 text-right">
                    {formatCurrency(cat.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">
            Orders by Status
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {Object.entries(reportData?.ordersByStatus || {}).map(
              ([status, count]) => {
                const colors = {
                  pending: "bg-yellow-100 text-yellow-800",
                  confirmed: "bg-blue-100 text-blue-800",
                  processing: "bg-indigo-100 text-indigo-800",
                  shipped: "bg-purple-100 text-purple-800",
                  delivered: "bg-green-100 text-green-800",
                  cancelled: "bg-red-100 text-red-800",
                };
                return (
                  <div
                    key={status}
                    className={`p-3 md:p-4 rounded-lg ${
                      colors[status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-xl md:text-2xl font-bold">{count}</p>
                    <p className="text-xs md:text-sm capitalize">{status}</p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
