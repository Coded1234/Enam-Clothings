"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiImage,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { productsAPI, adminAPI } from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Products = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categories = ["men", "women", "perfumes"];

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, pathname]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm }),
      };
      const { data } = await productsAPI.getAll(params);
      setProducts(data.products || data || []);
      setTotalPages(data.totalPages || data.pages || 1);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await adminAPI.deleteProduct(productToDelete.id);
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Controls: Search, Filter, Add Button */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 md:max-w-2xl">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 shadow-sm"
              />
            </div>
          </form>

          {/* Filter */}
          <div className="relative w-full sm:w-48 flex-shrink-0 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex items-center">
            <div className="pl-3 text-gray-400">
              <FiFilter size={16} />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent py-2.5 pl-2 pr-8 text-sm focus:outline-none focus:ring-0 text-gray-700 cursor-pointer appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium w-full md:w-auto"
        >
          <FiPlus size={18} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      router.push(`/admin/products/${product.id}/edit`)
                    }
                  >
                    {/* Image */}
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {product.images?.[0]?.url || product.images?.[0] ? (
                        <img
                          src={getImageUrl(
                            product.images[0]?.url || product.images[0],
                          )}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FiImage className="text-gray-400" size={16} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-gray-700">
                          {formatCurrency(
                            product.discountPrice ||
                              product.comparePrice ||
                              product.price,
                          )}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            (product.remainingStock ??
                              product.totalStock ??
                              product.stock) > 10
                              ? "text-green-600"
                              : (product.remainingStock ??
                                    product.totalStock ??
                                    product.stock) > 0
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          Stock:{" "}
                          {product.remainingStock ??
                            product.totalStock ??
                            product.stock ??
                            0}
                        </span>
                        {product.isActive ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 size={15} />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(product);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-400 py-12">
                  No products found
                </p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/products/${product.id}/edit`)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              {product.images?.[0]?.url ||
                              product.images?.[0] ? (
                                <img
                                  src={getImageUrl(
                                    product.images[0]?.url || product.images[0],
                                  )}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <FiImage
                                    className="text-gray-400"
                                    size={16}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.brand}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800 capitalize">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              product.discountPrice ||
                                product.comparePrice ||
                                product.price,
                            )}
                          </div>
                          {(product.discountPrice || product.comparePrice) &&
                            (product.discountPrice || product.comparePrice) <
                              product.price && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatCurrency(product.price)}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              (product.remainingStock ??
                                product.totalStock ??
                                product.stock) > 10
                                ? "text-green-600"
                                : (product.remainingStock ??
                                      product.totalStock ??
                                      product.stock) > 0
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {product.remainingStock ??
                              product.totalStock ??
                              product.stock ??
                              0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <FiEye size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              <FiEyeOff size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={16} />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(product);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-sm text-gray-500"
                      >
                        No products found
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 max-w-md w-full">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2">
              Delete Product
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Are you sure you want to delete "{productToDelete?.name}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="flex-1 px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 md:px-4 py-1.5 md:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
