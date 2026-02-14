import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiMail,
  FiPhone,
  FiToggleLeft,
  FiToggleRight,
  FiUser,
  FiShoppingBag,
} from "react-icons/fi";
import { adminAPI } from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getAllCustomers({
        page: currentPage,
        limit: 10,
      });
      setCustomers(data.customers || []);
      setTotalPages(data.pages || data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    try {
      setTogglingId(customerId);
      await adminAPI.toggleCustomerStatus(customerId);
      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, isActive: !currentStatus } : c,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to update customer status");
    } finally {
      setTogglingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Customers
        </h1>
        <span className="text-xs md:text-sm text-gray-500">
          {customers.length} total customers
        </span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm">
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="hidden sm:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 font-medium text-xs md:text-sm">
                                {customer.firstName?.[0]}
                                {customer.lastName?.[0]}
                              </span>
                            </div>
                            <div className="ml-2 md:ml-3">
                              <div className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[100px] md:max-w-none">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-500 capitalize hidden md:block">
                                {customer.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 truncate max-w-[150px] md:max-w-none">
                              <FiMail size={12} className="flex-shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 hidden md:flex">
                                <FiPhone size={12} />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiShoppingBag size={14} />
                            {customer.orderCount || 0}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-medium text-gray-900">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              customer.isActive !== false
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {customer.isActive !== false
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 md:gap-2">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiUser size={14} className="md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  customer.id,
                                  customer.isActive !== false,
                                )
                              }
                              disabled={togglingId === customer.id}
                              className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                customer.isActive !== false
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title={
                                customer.isActive !== false
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >
                              {togglingId === customer.id ? (
                                <LoadingSpinner size="small" />
                              ) : customer.isActive !== false ? (
                                <FiToggleRight
                                  size={16}
                                  className="md:w-[18px] md:h-[18px]"
                                />
                              ) : (
                                <FiToggleLeft
                                  size={16}
                                  className="md:w-[18px] md:h-[18px]"
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-2 md:px-6 py-6 md:py-12 text-center text-xs md:text-sm text-gray-500"
                      >
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs md:text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                Customer Details
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold text-xl">
                  {selectedCustomer.firstName?.[0]}
                  {selectedCustomer.lastName?.[0]}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h4>
                <p className="text-gray-500 capitalize">
                  {selectedCustomer.role}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <FiMail size={18} />
                <span>{selectedCustomer.email}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <FiPhone size={18} />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {selectedCustomer.orderCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-800">
                  {new Date(selectedCustomer.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
