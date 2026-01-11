import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUpload, FiX, FiSave, FiArrowLeft, FiImage } from "react-icons/fi";
import { productsAPI, adminAPI } from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    category: "",
    subcategory: "",
    brand: "",
    totalStock: "",
    sizes: [],
    colors: [],
    images: [],
    isActive: true,
    featured: false,
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const fileInputRef = useRef(null);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState({ name: "", code: "#000000" });

  const categories = [
    {
      value: "men",
      label: "Men",
      subcategories: ["shirts", "pants", "jackets", "suits"],
    },
    {
      value: "women",
      label: "Women",
      subcategories: ["dresses", "tops", "skirts", "pants"],
    },
    {
      value: "kids",
      label: "Kids",
      subcategories: ["boys", "girls", "babies"],
    },
  ];

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getById(id);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        price: data.price || "",
        comparePrice: data.comparePrice || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        brand: data.brand || "",
        totalStock: data.totalStock || "",
        sizes: data.sizes || [],
        colors: data.colors || [],
        images: data.images || [],
        isActive: data.isActive !== false,
        featured: data.featured || false,
      });
      // Set existing images for editing
      if (data.images?.length > 0) {
        setExistingImages(
          data.images.map((img) =>
            typeof img === "string" ? { url: img, publicId: "" } : img
          )
        );
      }
    } catch (err) {
      setError("Failed to load product");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images total
    const totalImages =
      existingImages.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...prev.sizes, newSize],
      }));
      setNewSize("");
    }
  };

  const removeSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s !== size),
    }));
  };

  const addColor = () => {
    if (
      newColor.name &&
      !formData.colors.find((c) => (c.name || c) === newColor.name)
    ) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, { name: newColor.name, code: newColor.code }],
      }));
      setNewColor({ name: "", code: "#000000" });
    }
  };

  const removeColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.price || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      // Create FormData for file upload
      const submitData = new FormData();

      // Add basic fields
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("price", parseFloat(formData.price));
      if (formData.comparePrice) {
        submitData.append("comparePrice", parseFloat(formData.comparePrice));
      }
      submitData.append("category", formData.category);
      submitData.append("subcategory", formData.subcategory);
      submitData.append("brand", formData.brand);
      submitData.append("totalStock", parseInt(formData.totalStock) || 0);
      submitData.append("isActive", formData.isActive);
      submitData.append("featured", formData.featured);

      // Add sizes and colors as JSON strings
      submitData.append("sizes", JSON.stringify(formData.sizes));
      submitData.append("colors", JSON.stringify(formData.colors));

      // Add existing images as JSON string
      if (existingImages.length > 0) {
        submitData.append("existingImages", JSON.stringify(existingImages));
      }

      // Add new image files
      imageFiles.forEach((file) => {
        submitData.append("images", file);
      });

      if (isEditing) {
        await adminAPI.updateProduct(id, submitData);
      } else {
        await adminAPI.createProduct(submitData);
      }

      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(
    (c) => c.value === formData.category
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {isEditing ? "Edit Product" : "Add New Product"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-3 md:px-4 py-2 md:py-3 rounded-lg mb-4 md:mb-6 text-sm md:text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Subcategory</option>
                  {selectedCategory.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
            Pricing & Inventory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Price (GHS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare Price (GHS)
              </label>
              <input
                type="number"
                name="comparePrice"
                value={formData.comparePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Stock
              </label>
              <input
                type="number"
                name="totalStock"
                value={formData.totalStock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Sizes & Colors */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
            Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Sizes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="e.g., XL"
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="px-3 md:px-4 py-1.5 md:py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.sizes.map((size, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="hover:text-red-600"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) =>
                    setNewColor((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Color name (e.g., Red)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2 px-3 border border-gray-300 rounded-lg">
                  <input
                    type="color"
                    value={newColor.code}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, code: e.target.value }))
                    }
                    className="w-10 h-8 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={addColor}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, index) => {
                  const colorObj =
                    typeof color === "string"
                      ? { name: color, code: "#000000" }
                      : color;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: colorObj.code }}
                      />
                      {colorObj.name}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="hover:text-red-600"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
            Images
          </h2>

          {/* Upload Button */}
          <div className="mb-3 md:mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FiUpload size={18} className="text-gray-500 md:w-5 md:h-5" />
              <span className="text-gray-600 text-xs md:text-sm">
                Click to upload images
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Max 5 images. Supported formats: JPG, PNG, WEBP
            </p>
          </div>

          {/* Image Previews */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
            {/* Existing Images */}
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={img.url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX size={12} className="md:w-[14px] md:h-[14px]" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                  Saved
                </span>
              </div>
            ))}

            {/* New Image Previews */}
            {imagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt={`New ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX size={12} className="md:w-[14px] md:h-[14px]" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-primary-500 text-white px-1 rounded">
                  New
                </span>
              </div>
            ))}

            {/* Empty State */}
            {existingImages.length === 0 && imagePreviews.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-400">
                <FiImage size={48} />
                <p className="mt-2">No images added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">
            Status
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700 text-sm md:text-base">
                Product is Active
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 md:w-5 md:h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700 text-sm md:text-base">
                Featured Product
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 md:px-6 py-1.5 md:py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <FiSave size={16} className="md:w-[18px] md:h-[18px]" />
            {saving
              ? "Saving..."
              : isEditing
              ? "Update Product"
              : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
