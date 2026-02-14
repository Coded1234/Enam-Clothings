import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  setFilters,
  clearFilters,
} from "../../redux/slices/productSlice";
import ProductCard from "../../components/customer/ProductCard";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiGrid,
  FiList,
  FiSearch,
} from "react-icons/fi";

const FilterSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-200 py-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-gray-800 font-medium"
    >
      {title}
      <FiChevronDown
        className={`transform transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
    {isOpen && <div className="mt-4">{children}</div>}
  </div>
);

const Shop = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products, loading, pagination, filters } = useSelector(
    (state) => state.products
  );

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    price: true,
    size: true,
    color: false,
  });
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");

  const handleMinPriceChange = useCallback((e) => {
    setTempMinPrice(e.target.value);
  }, []);

  const handleMaxPriceChange = useCallback((e) => {
    setTempMaxPrice(e.target.value);
  }, []);

  const categories = [
    { value: "", label: "All Categories" },
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const colors = [
    { name: "Black", code: "#000000" },
    { name: "White", code: "#FFFFFF" },
    { name: "Red", code: "#EF4444" },
    { name: "Blue", code: "#3B82F6" },
    { name: "Green", code: "#22C55E" },
    { name: "Yellow", code: "#EAB308" },
    { name: "Purple", code: "#A855F7" },
    { name: "Pink", code: "#EC4899" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "popular", label: "Most Popular" },
  ];

  // Keep redux "category" filter in sync with the route category.
  // This prevents stale category filters sticking around when navigating to /shop (all products)
  // and allows switching between men/women reliably.
  useEffect(() => {
    dispatch(setFilters({ category: category || "" }));

    // Ensure query-string category doesn't conflict with route category
    const newParams = new URLSearchParams(searchParams);
    if (newParams.has("category")) newParams.delete("category");
    if (newParams.get("page") !== "1") newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, dispatch]);

  // Prevent background scrolling when mobile filter drawer is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.documentElement.classList.add("overflow-hidden");
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  useEffect(() => {
    const effectiveCategory = category || searchParams.get("category") || "";
    const params = {
      page: searchParams.get("page") || 1,
      // category must come from the URL (route param or query), not from stale redux state
      category: effectiveCategory,
      minPrice: searchParams.get("minPrice") || filters.minPrice,
      maxPrice: searchParams.get("maxPrice") || filters.maxPrice,
      size: searchParams.get("size") || filters.size,
      color: searchParams.get("color") || filters.color,
      sort: searchParams.get("sort") || filters.sort,
      search: searchParams.get("search") || "",
      featured: searchParams.get("featured") || "",
    };

    // Clean empty params
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });

    dispatch(fetchProducts(params));
  }, [dispatch, category, searchParams, filters]);

  useEffect(() => {
    setTempMinPrice(filters.minPrice || "");
    setTempMaxPrice(filters.maxPrice || "");
  }, [filters.minPrice, filters.maxPrice]);

  const handleFilterChange = (key, value) => {
    // Category is driven by the route (/shop, /shop/men, /shop/women)
    if (key === "category") {
      dispatch(setFilters({ category: value }));

      const newParams = new URLSearchParams(searchParams);
      // category comes from route; keep query clean
      newParams.delete("category");
      newParams.set("page", "1");

      const targetPath = value ? `/shop/${value}` : "/shop";
      const qs = newParams.toString();
      navigate(qs ? `${targetPath}?${qs}` : targetPath);
      return;
    }

    dispatch(setFilters({ [key]: value }));

    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchParams({});
    setTempMinPrice("");
    setTempMaxPrice("");
  };

  const applyPriceFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);

    if (tempMinPrice) {
      newParams.set("minPrice", tempMinPrice);
    } else {
      newParams.delete("minPrice");
    }

    if (tempMaxPrice) {
      newParams.set("maxPrice", tempMaxPrice);
    } else {
      newParams.delete("maxPrice");
    }

    newParams.set("page", "1");
    setSearchParams(newParams);

    dispatch(setFilters({ minPrice: tempMinPrice, maxPrice: tempMaxPrice }));
  }, [tempMinPrice, tempMaxPrice, searchParams, setSearchParams, dispatch]);

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== "newest"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 capitalize">
            {category || "All Products"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {pagination.total} products found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <FilterSection
                title="Category"
                isOpen={expandedFilters.category}
                onToggle={() => toggleFilterSection("category")}
              >
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.value}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.value}
                        onChange={() =>
                          handleFilterChange("category", cat.value)
                        }
                        className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-gray-600">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Price, GH₵"
                isOpen={expandedFilters.price}
                onToggle={() => toggleFilterSection("price")}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="min"
                      value={tempMinPrice}
                      onChange={handleMinPriceChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="flex items-center text-gray-400">—</span>
                    <input
                      type="number"
                      placeholder="max"
                      value={tempMaxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setTempMinPrice("");
                        setTempMaxPrice("");
                        handleFilterChange("minPrice", "");
                        handleFilterChange("maxPrice", "");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 uppercase"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyPriceFilter}
                      className="text-xs text-green-600 hover:text-green-700 font-medium uppercase"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </FilterSection>

              <FilterSection
                title="Size"
                isOpen={expandedFilters.size}
                onToggle={() => toggleFilterSection("size")}
              >
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        handleFilterChange(
                          "size",
                          filters.size === size ? "" : size
                        )
                      }
                      className={`w-10 h-10 rounded-lg border font-medium transition-colors ${
                        filters.size === size
                          ? "bg-primary-500 text-white border-primary-500"
                          : "hover:border-primary-500 hover:text-primary-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Color"
                isOpen={expandedFilters.color}
                onToggle={() => toggleFilterSection("color")}
              >
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        handleFilterChange(
                          "color",
                          filters.color === color.name ? "" : color.name
                        )
                      }
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        filters.color === color.name
                          ? "ring-2 ring-offset-2 ring-primary-500"
                          : ""
                      }`}
                      style={{ backgroundColor: color.code }}
                    />
                  ))}
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <FiFilter />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-gray-600 hidden sm:inline">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid"
                      ? "bg-primary-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <FiGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${
                    viewMode === "list"
                      ? "bg-primary-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <FiList size={20} />
                </button>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.category && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    Category: {filters.category}
                    <button onClick={() => handleFilterChange("category", "")}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {filters.size && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    Size: {filters.size}
                    <button onClick={() => handleFilterChange("size", "")}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {filters.color && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    Color: {filters.color}
                    <button onClick={() => handleFilterChange("color", "")}>
                      <FiX size={14} />
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    Price: GH₵{filters.minPrice || "0"} - GH₵
                    {filters.maxPrice || "∞"}
                    <button
                      onClick={() => {
                        handleFilterChange("minPrice", "");
                        handleFilterChange("maxPrice", "");
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiSearch className="text-gray-400" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search term
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1;
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg ${
                          pagination.page === page
                            ? "bg-primary-500 text-white"
                            : "border hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === pagination.page - 2 ||
                    page === pagination.page + 2
                  ) {
                    return (
                      <span key={page} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto animate-slide-down">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-4">
              {/* Category */}
              <FilterSection
                title="Category"
                isOpen={expandedFilters.category}
                onToggle={() => toggleFilterSection("category")}
              >
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.value}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={filters.category === cat.value}
                        onChange={() =>
                          handleFilterChange("category", cat.value)
                        }
                        className="w-4 h-4 text-primary-500"
                      />
                      <span className="text-gray-600">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Size"
                isOpen={expandedFilters.size}
                onToggle={() => toggleFilterSection("size")}
              >
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        handleFilterChange(
                          "size",
                          filters.size === size ? "" : size
                        )
                      }
                      className={`w-10 h-10 rounded-lg border font-medium ${
                        filters.size === size
                          ? "bg-primary-500 text-white border-primary-500"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Color"
                isOpen={expandedFilters.color}
                onToggle={() => toggleFilterSection("color")}
              >
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        handleFilterChange(
                          "color",
                          filters.color === color.name ? "" : color.name
                        )
                      }
                      className={`w-8 h-8 rounded-full border-2 ${
                        filters.color === color.name
                          ? "ring-2 ring-offset-2 ring-primary-500"
                          : ""
                      }`}
                      style={{ backgroundColor: color.code }}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Price, GH₵"
                isOpen={expandedFilters.price}
                onToggle={() => toggleFilterSection("price")}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="min"
                      value={tempMinPrice}
                      onChange={handleMinPriceChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                    <span className="flex items-center text-gray-400">—</span>
                    <input
                      type="number"
                      placeholder="max"
                      value={tempMaxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setTempMinPrice("");
                        setTempMaxPrice("");
                        handleFilterChange("minPrice", "");
                        handleFilterChange("maxPrice", "");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 uppercase"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyPriceFilter}
                      className="text-xs text-green-600 hover:text-green-700 font-medium uppercase"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </FilterSection>
            </div>

            {/* Apply Button */}
            <div className="p-3 sm:p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2 sm:py-3 text-sm sm:text-base bg-primary-500 text-white rounded-lg font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
