import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiFolder,
  FiFolderPlus,
  FiX,
  FiCheck,
  FiMove,
} from "react-icons/fi";
import api from "../../utils/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [expandedCategories, setExpandedCategories] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    display_order: 0,
    is_active: true,
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories?includeInactive=true");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showNotification("error", "Failed to fetch categories");
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

  const openModal = (category = null, parentId = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        parent_id: category.parent_id || "",
        display_order: category.display_order || 0,
        is_active: category.is_active,
        meta_title: category.meta_title || "",
        meta_description: category.meta_description || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        parent_id: parentId || "",
        display_order: 0,
        is_active: true,
        meta_title: "",
        meta_description: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
        display_order: parseInt(formData.display_order) || 0,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showNotification("success", "Category updated successfully");
      } else {
        await api.post("/categories", payload);
        showNotification("success", "Category created successfully");
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save category"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      await api.delete(`/categories/${id}`);
      showNotification("success", "Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to delete category"
      );
    }
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getAllParentOptions = () => {
    // Return flat list of parent categories for dropdown
    return categories.filter((cat) => !cat.parent_id);
  };

  const renderCategory = (category, level = 0) => {
    const hasSubcategories =
      category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <React.Fragment key={category.id}>
        <tr
          className={`hover:bg-gray-50 ${
            !category.is_active ? "opacity-50" : ""
          }`}
        >
          <td className="px-2 md:px-6 py-2 md:py-4">
            <div
              className="flex items-center"
              style={{ paddingLeft: `${level * 24}px` }}
            >
              {hasSubcategories ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 mr-2 hover:bg-gray-200 rounded"
                >
                  <FiChevronRight
                    className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <span className="w-6 mr-2"></span>
              )}
              <div className="p-1.5 md:p-2 bg-primary-100 rounded-lg mr-2 md:mr-3">
                <FiFolder className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">
                  {category.name}
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  {category.slug}
                </p>
              </div>
            </div>
          </td>
          <td className="px-2 md:px-6 py-2 md:py-4 hidden md:table-cell">
            <p className="text-xs md:text-sm text-gray-600 truncate max-w-[200px]">
              {category.description || "-"}
            </p>
          </td>
          <td className="px-2 md:px-6 py-2 md:py-4 hidden sm:table-cell">
            {hasSubcategories ? (
              <span className="text-xs md:text-sm text-gray-600">
                {category.subcategories.length} subcategories
              </span>
            ) : (
              <span className="text-xs md:text-sm text-gray-400">-</span>
            )}
          </td>
          <td className="px-2 md:px-6 py-2 md:py-4 hidden sm:table-cell">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                category.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {category.is_active ? "Active" : "Inactive"}
            </span>
          </td>
          <td className="px-2 md:px-6 py-2 md:py-4">
            <div className="flex items-center justify-end gap-1 md:gap-2">
              <button
                onClick={() => openModal(null, category.id)}
                className="p-1.5 md:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Add subcategory"
              >
                <FiFolderPlus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <button
                onClick={() => openModal(category)}
                className="p-1.5 md:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          </td>
        </tr>
        {hasSubcategories &&
          isExpanded &&
          category.subcategories.map((sub) => renderCategory(sub, level + 1))}
      </React.Fragment>
    );
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
            Categories
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Manage product categories and subcategories
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
        >
          <FiPlus size={16} className="md:w-5 md:h-5" />
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No categories found</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlus className="w-4 h-4" />
              Create your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Subcategories
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => renderCategory(category))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Default Categories Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4">
        <h3 className="font-medium text-blue-900 mb-2 text-sm md:text-base">
          Note about Default Categories
        </h3>
        <p className="text-xs md:text-sm text-blue-700">
          The product system currently uses these predefined categories:{" "}
          <strong>Men</strong>, <strong>Women</strong>, <strong>Kids</strong>.
          Categories created here can be used for future product organization
          and filtering. To use custom categories with products, the product
          form needs to be updated to use dynamic categories from this list.
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {editingCategory
                  ? "Edit Category"
                  : formData.parent_id
                  ? "Add Subcategory"
                  : "Add Category"}
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
              {/* Name */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., T-Shirts"
                  required
                  className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">None (Top-level category)</option>
                  {getAllParentOptions().map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.id}
                      disabled={editingCategory?.id === cat.id}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* SEO Fields */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  SEO Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title: e.target.value })
                      }
                      placeholder="SEO title for this category"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meta_description: e.target.value,
                        })
                      }
                      placeholder="SEO description for this category"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
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
                  {editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
