import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import {
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronDown,
} from "react-icons/fi";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const categories = [
    { name: "Men", path: "/shop/men" },
    { name: "Women", path: "/shop/women" },
    { name: "Kids", path: "/shop/kids" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p>Free shipping on orders over GH₵50,000</p>
          <div className="hidden md:flex gap-4">
            <Link to="/orders" className="hover:text-primary-400">
              Track Order
            </Link>
            <span>|</span>
            <span>📞 +233256810699</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button - Left Side */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden hover:bg-gray-100 rounded-full"
          >
            <FiMenu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="text-xl sm:text-2xl font-bold gradient-text whitespace-nowrap">
            Enam's Clothings
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiSearch size={20} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
            >
              <FiHeart size={20} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <FiShoppingCart size={20} />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.firstName?.[0]}
                  </div>
                  <FiChevronDown className="hidden md:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 animate-slide-down">
                    <p className="px-4 py-2 text-sm text-gray-500 border-b">
                      Hi, {user?.firstName}!
                    </p>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
              >
                <FiUser size={18} />
                <span className="hidden md:inline">Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t animate-slide-down">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Slide-in Overlay Menu */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Slide-in Panel */}
        <div
          className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-500 to-secondary-500">
            <Link
              to="/"
              className="text-xl font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Enam's Clothings
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* User Section */}
          {isAuthenticated ? (
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.firstName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Hi, {user?.firstName}!
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b bg-gray-50">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiUser size={18} />
                Login / Sign Up
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Shop by Category
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Account Links */}
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              My Account
            </p>
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Profile
            </Link>
            <Link
              to="/orders"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Orders
            </Link>
            <Link
              to="/wishlist"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiHeart className="mr-2" /> Wishlist
            </Link>
            <Link
              to="/cart"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiShoppingCart className="mr-2" /> Cart
              {items.length > 0 && (
                <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                  {items.length}
                </span>
              )}
            </Link>
          </div>

          {/* Logout Button */}
          {isAuthenticated && (
            <>
              <div className="border-t my-2" />
              <div className="p-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {/* Contact Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-500 text-center">
              📞 +233256810699
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Free shipping on orders over GH₵50,000
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
