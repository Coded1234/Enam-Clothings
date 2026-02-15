import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FiSearch, FiFilter, FiX, FiGrid, FiList } from "react-icons/fi";
import api from "../../utils/api";
import ProductCard from "../../components/customer/ProductCard";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "relevance",
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
  ];

  const fetchSearchResults = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: query,
        page: pagination.page,
        limit: 12,
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sort && { sort: filters.sort }),
      });

      const response = await api.get(`/products?${params}`);
      setProducts(response.data.products || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        pages: response.data.pagination?.pages || 1,
        total: response.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Error searching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination.page]);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query, fetchSearchResults]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "relevance",
    });
    setSearchParams({ q: query });
  };

  const hasActiveFilters =
    filters.category || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-gray-600">
              {loading ? (
                "Searching..."
              ) : (
                <>
                  {pagination.total} result{pagination.total !== 1 ? "s" : ""}{" "}
                  for "<span className="font-semibold">{query}</span>"
                </>
              )}
            </p>
          )}
        </div>

        {!query ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start Your Search
            </h2>
            <p className="text-gray-600 mb-6">
              Enter a search term to find products
            </p>
            <Link
              to="/shop"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (GH₵)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-black"
                      style={{ backgroundColor: "white", color: "black" }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-black"
                      style={{ backgroundColor: "white", color: "black" }}
                    />
                  </div>
                </div>

                {/* Quick Price Ranges */}
                <div className="space-y-2">
                  {[
                    { label: "Under GH₵50", min: "", max: "50" },
                    { label: "GH₵50 - GH₵100", min: "50", max: "100" },
                    { label: "GH₵100 - GH₵200", min: "100", max: "200" },
                    { label: "Over GH₵200", min: "200", max: "" },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        handleFilterChange("minPrice", range.min);
                        handleFilterChange("maxPrice", range.max);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.minPrice === range.min &&
                        filters.maxPrice === range.max
                          ? "bg-primary-100 text-primary-700"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FiFilter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    )}
                  </button>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Sort by:</label>
                    <select
                      value={filters.sort}
                      onChange={(e) =>
                        handleFilterChange("sort", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">
                      Active filters:
                    </span>
                    {filters.category && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {
                          categories.find((c) => c.value === filters.category)
                            ?.label
                        }
                        <button
                          onClick={() => handleFilterChange("category", "")}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                        {filters.minPrice && `GH₵${filters.minPrice}`}
                        {filters.minPrice && filters.maxPrice && " - "}
                        {filters.maxPrice && `GH₵${filters.maxPrice}`}
                        {!filters.minPrice &&
                          filters.maxPrice &&
                          `Under GH₵${filters.maxPrice}`}
                        {filters.minPrice &&
                          !filters.maxPrice &&
                          `Over GH₵${filters.minPrice}`}
                        <button
                          onClick={() => {
                            handleFilterChange("minPrice", "");
                            handleFilterChange("maxPrice", "");
                          }}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Results */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Products Found
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any products matching "{query}". Try
                    different keywords or adjust your filters.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <Link
                      to="/shop"
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Browse All Products
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (GH₵)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-8">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
