"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../redux/slices/authSlice";
import { useTheme } from "../context/ThemeContext";
import ScrollToTop from "../components/common/ScrollToTop";
import { ordersAPI } from "../utils/api";
import {
  FiHome, FiShoppingBag, FiShoppingCart, FiUsers, FiStar,
  FiMenu, FiX, FiLogOut, FiChevronDown, FiBarChart2, FiTag,
  FiSun, FiMoon, FiBell,
} from "react-icons/fi";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [dynamicHeader, setDynamicHeader] = useState("");

  const menuItems = [
    { path: "/admin", icon: FiHome, label: "Dashboard" },
    { path: "/admin/products", icon: FiShoppingBag, label: "Products" },
    { path: "/admin/orders", icon: FiShoppingCart, label: "Orders" },
    { path: "/admin/customers", icon: FiUsers, label: "Customers" },
    { path: "/admin/reviews", icon: FiStar, label: "Reviews" },
    { path: "/admin/coupons", icon: FiTag, label: "Coupons" },
    { path: "/admin/announcements", icon: FiBell, label: "Announcements" },
    { path: "/admin/reports", icon: FiBarChart2, label: "Reports" },
  ];

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [dropdownOpen]);

  useEffect(() => {
    if (sidebarOpen) {
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
  }, [sidebarOpen]);

  useEffect(() => {
    const fetchDynamicHeader = async () => {
      setDynamicHeader("");
      if (pathname.startsWith("/admin/orders/") && pathname.split("/").length === 4) {
        const orderId = pathname.split("/").pop();
        if (orderId && orderId !== "orders") {
          try {
            const { data } = await ordersAPI.getById(orderId);
            if (data?.orderNumber) {
              setDynamicHeader(`Order #${data.orderNumber}`);
            }
          } catch (err) {
            console.error("Failed to fetch order title info:", err);
          }
        }
      }
    };
    fetchDynamicHeader();
  }, [pathname]);

  const getPageTitle = () => {
    const matchedItem = menuItems.find((item) => item.path === pathname);
    if (matchedItem) return matchedItem.label;

    if (dynamicHeader) return dynamicHeader;

    if (pathname.startsWith("/admin/orders/")) {
      return "Order Details";
    }

    return "Admin";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 text-gray-700 transition-transform duration-300 flex flex-col`}>
        <div className="h-[72px] px-4 flex items-center justify-between border-b border-gray-200">
          <Link href="/admin" className="flex items-center w-full justify-center">
            <img src="/images/loginlogo.png" alt="Diamond Aura Gallery" className="h-12 w-auto object-contain max-w-full" />
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-50 lg:hidden absolute right-4 top-4">
            <FiX size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.path ? "bg-primary-500 text-white" : "text-gray-400 hover:bg-gray-50 hover:text-primary-500"}`}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 flex items-center gap-2">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex-1 flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-primary-500 rounded-lg">
            <FiShoppingBag size={20} />
            <span>Back to Store</span>
          </Link>
          <button onClick={toggleTheme} className="p-3 text-gray-400 hover:bg-gray-50 hover:text-primary-500 rounded-lg transition-colors" aria-label="Toggle theme">
            {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="h-[72px] bg-white shadow-xs border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 -ml-2">
              <FiMenu size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.firstName?.[0]}
              </div>
              {user?.firstName}
              <FiChevronDown />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2">
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <ScrollToTop />
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial="initial" animate="animate" exit="exit" variants={pageVariants}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
