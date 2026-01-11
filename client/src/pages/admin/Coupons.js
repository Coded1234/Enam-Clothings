import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiCalendar,
  FiCheck,
} from "react-icons/fi";
import api from "../../utils/api";

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    usage_limit: "",
    usage_limit_per_user: "1",
    start_date: "",
    end_date: "",
    is_active: true,
    applicable_categories: [],
  });

  const categories = ["men", "women", "kids"];

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { search }),
      });

      const response = await api.get(`/coupons?${params}`);
      setCoupons(response.data.coupons);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      showNotification("error", "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(
      () => setNotification({ show: false, type: "", message: "" }),
      3000
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCoupons();
  };

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase || "",
        max_discount: coupon.max_discount || "",
        usage_limit: coupon.usage_limit || "",
        usage_limit_per_user: coupon.usage_limit_per_user || "1",
        start_date: coupon.start_date ? coupon.start_date.split("T")[0] : "",
        end_date: coupon.end_date ? coupon.end_date.split("T")[0] : "",
        is_active: coupon.is_active,
        applicable_categories: coupon.applicable_categories || [],
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_purchase: "",
        max_discount: "",
        usage_limit: "",
        usage_limit_per_user: "1",
        start_date: "",
        end_date: "",
        is_active: true,
        applicable_categories: [],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_purchase: formData.min_purchase
          ? parseFloat(formData.min_purchase)
          : null,
        max_discount: formData.max_discount
          ? parseFloat(formData.max_discount)
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        usage_limit_per_user: formData.usage_limit_per_user
          ? parseInt(formData.usage_limit_per_user)
          : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
        showNotification("success", "Coupon updated successfully");
      } else {
        await api.post("/coupons", payload);
        showNotification("success", "Coupon created successfully");
      }

      closeModal();
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save coupon"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await api.delete(`/coupons/${id}`);
      showNotification("success", "Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showNotification("error", "Failed to delete coupon");
    }
  };

  const toggleCategory = (category) => {
    setFormData((prev) => ({
      ...prev,
      applicable_categories: prev.applicable_categories.includes(category)
        ? prev.applicable_categories.filter((c) => c !== category)
        : [...prev.applicable_categories, category],
    }));
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    if (!coupon.is_active)
      return { label: "Inactive", color: "bg-gray-100 text-gray-800" };
    if (coupon.start_date && new Date(coupon.start_date) > now)
      return { label: "Scheduled", color: "bg-blue-100 text-blue-800" };
    if (coupon.end_date && new Date(coupon.end_date) < now)
      return { label: "Expired", color: "bg-red-100 text-red-800" };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit)
      return { label: "Exhausted", color: "bg-orange-100 text-orange-800" };
    return { label: "Active", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <FiCheck className="w-5 h-5" />
          ) : (
            <FiX className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Coupons
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Manage discount coupons for your store
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
        >
          <FiPlus size={16} className="md:w-5 md:h-5" />
          Create Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <FiTag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Usage
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Validity
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="p-1.5 md:p-2 bg-primary-100 rounded-lg">
                            <FiTag className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-gray-900 text-xs md:text-sm">
                              {coupon.code}
                            </p>
                            {coupon.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-[200px]">
                                {coupon.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === "percentage" ? (
                            <>
                              <FiPercent className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                              <span className="font-semibold text-xs md:text-sm">
                                {coupon.discount_value}%
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-xs md:text-sm">
                                GH₵{coupon.discount_value}
                              </span>
                            </>
                          )}
                        </div>
                        {coupon.min_purchase > 0 && (
                          <p className="text-xs text-gray-500 hidden md:block">
                            Min: GH₵{coupon.min_purchase}
                          </p>
                        )}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap hidden sm:table-cell">
                        <p className="text-gray-900 text-xs md:text-sm">
                          {coupon.used_count} / {coupon.usage_limit || "∞"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {coupon.usage_limit_per_user} per user
                        </p>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap hidden lg:table-cell">
                        {coupon.start_date || coupon.end_date ? (
                          <div className="text-sm">
                            {coupon.start_date && (
                              <p className="text-gray-600">
                                From:{" "}
                                {new Date(
                                  coupon.start_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {coupon.end_date && (
                              <p className="text-gray-600">
                                To:{" "}
                                {new Date(coupon.end_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No limit</span>
                        )}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap hidden md:table-cell">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          <button
                            onClick={() => openModal(coupon)}
                            className="p-1.5 md:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs md:text-sm text-gray-600">
              Showing {coupons.length} of {pagination.total} coupons
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {editingCoupon ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 md:p-6 space-y-4 md:space-y-6"
            >
              {/* Code & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., SUMMER20"
                    required
                    className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g., Summer sale discount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GH₵)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={
                      formData.discount_type === "percentage" ? "1" : "0.01"
                    }
                    max={
                      formData.discount_type === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    placeholder={
                      formData.discount_type === "percentage"
                        ? "e.g., 20"
                        : "e.g., 50.00"
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {formData.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Discount (GH₵)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount: e.target.value,
                        })
                      }
                      placeholder="e.g., 100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Min Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Purchase Amount (GH₵)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase}
                  onChange={(e) =>
                    setFormData({ ...formData, min_purchase: e.target.value })
                  }
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_user}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_limit_per_user: e.target.value,
                      })
                    }
                    placeholder="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Applicable Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Categories
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Leave empty to apply to all categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                        formData.applicable_categories.includes(category)
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 md:px-4 py-1.5 md:py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
