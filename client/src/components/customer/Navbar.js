import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../redux/slices/authSlice";
import api from "../../utils/api";
import {
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronDown,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

const defaultPromoMessages = [
  "Free shipping on orders over GH₵1,000",
  "🔥 New arrivals just dropped!",
  "💫 Up to 30% off on selected items",
  "📦 Fast & secure delivery nationwide",
];

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoMessages, setPromoMessages] = useState(defaultPromoMessages);
  const dropdownRef = useRef(null);

  // Fetch active coupon and add to promo messages
  useEffect(() => {
    const fetchActiveCoupon = async () => {
      try {
        const response = await api.get("/coupons/active/homepage");
        if (response.data.success && response.data.coupon) {
          const coupon = response.data.coupon;
          const couponMessage =
            coupon.ai_message
              ?.split("\n")[0]
              ?.replace(/(\d+)\.\d+%/g, "$1%")
              .replace(/GH₵(\d+)\.\d+/g, "GH₵$1") ||
            `🎉 Get ${
              coupon.discount_type === "percentage"
                ? Math.round(coupon.discount_value) + "%"
                : "GH₵" + Math.round(coupon.discount_value)
            } Off ${coupon.description || "Your Purchase"}!`;
          setPromoMessages([couponMessage, ...defaultPromoMessages]);
        }
      } catch (error) {
        console.error("Error fetching active coupon:", error);
      }
    };
    fetchActiveCoupon();
  }, []);

  // Rotate promo messages
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promoMessages.length]);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const categories = [
    { name: "Men", path: "/shop/men" },
    { name: "Women", path: "/shop/women" },
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
    navigate("/login");
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

  // Prevent background/body scrolling when the mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
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
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white dark:bg-surface shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm py-2 overflow-hidden">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="relative h-5 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={promoIndex}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute whitespace-nowrap"
              >
                {promoMessages[promoIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="hidden md:flex gap-4 flex-shrink-0 ml-4">
            <Link to="/orders" className="hover:text-primary-400">
              Track Order
            </Link>
            <span>|</span>
            <span>📞 +233200620026</span>
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
            aria-label="Toggle mobile menu"
          >
            <FiMenu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/images/loginlogo.png"
              alt="The Fashion Gallery"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className="text-gray-700 dark:text-gold-light hover:text-primary-500 font-medium transition-colors"
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
              className="p-2 hover:bg-gray-100 dark:hover:bg-opacity-10 rounded-full transition-colors"
              aria-label="Toggle search"
            >
              <FiSearch size={20} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 hover:bg-gray-100 dark:hover:bg-opacity-10 rounded-full transition-colors hidden md:block"
              aria-label="View wishlist"
            >
              <FiHeart size={20} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 hover:bg-gray-100 dark:hover:bg-opacity-10 rounded-full transition-colors relative"
              aria-label={`Shopping cart with ${items.length} items`}
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
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-opacity-10 rounded-full"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.firstName?.[0]}
                  </div>
                  <FiChevronDown className="hidden md:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface rounded-lg shadow-lg py-2 z-50 animate-slide-down">
                    <p className="px-4 py-2 text-sm text-gray-500 dark:text-primary-300 border-b dark:border-primary-700">
                      Hi, {user?.firstName}!
                    </p>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 dark:text-gold-light hover:bg-gray-100 dark:hover:bg-opacity-10"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 dark:text-gold-light hover:bg-gray-100 dark:hover:bg-opacity-10"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 dark:text-gold-light hover:bg-gray-100 dark:hover:bg-opacity-10"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-gray-700 dark:text-gold-light hover:bg-gray-100 dark:hover:bg-opacity-10"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/newsletter"
                      className="block px-4 py-2 text-gray-700 dark:text-gold-light hover:bg-gray-100 dark:hover:bg-opacity-10"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Newsletter
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-opacity-10"
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
          <div className="py-4 border-t animate-slide-down px-4">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="flex-1 min-w-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-black"
                style={{ backgroundColor: "white", color: "black" }}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0"
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
          className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-surface z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-500 to-secondary-500">
            <Link
              to="/"
              className="flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src="/images/loginlogo.png"
                alt="The Fashion Gallery"
                className="h-10 w-auto object-contain"
              />
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
            <div className="p-4 border-b bg-white dark:bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.firstName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gold-light">
                    Hi, {user?.firstName}!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-primary-300">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b bg-white dark:bg-surface">
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
                className="flex items-center px-4 py-3 text-gray-700 dark:text-gold-light hover:bg-primary-50 dark:hover:bg-opacity-10 hover:text-primary-600 font-medium transition-colors"
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
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-surface border-t dark:border-primary-700">
            <div className="flex items-center justify-center gap-3 mb-1">
              <p className="text-sm text-gray-500 dark:text-gold">
                📞 +233200620026
              </p>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-secondary-600 text-gray-600 dark:text-gold hover:bg-gray-200 dark:hover:bg-secondary-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-primary-300 text-center">
              Free shipping on orders over GH₵1,000
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
