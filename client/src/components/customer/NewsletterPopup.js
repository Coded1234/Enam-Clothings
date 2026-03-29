"use client";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiMail,
  FiBell,
  FiCheck,
  FiTruck,
  FiShield,
  FiHeadphones,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { newsletterAPI } from "../../utils/api";
import { useSelector } from "react-redux";

const NewsletterPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);

  // Pages where popup should NOT show
  const excludedPaths = [
    "/checkout",
    "/order-summary",
    "/payment/verify",
    "/login",
    "/register",
  ];

  useEffect(() => {
    // Don't show on excluded pages
    if (excludedPaths.some((path) => pathname.startsWith(path))) {
      return;
    }

    // Check if user permanently dismissed or recently closed
    const neverShow = localStorage.getItem("newsletter_never_show");
    const lastDismissed = localStorage.getItem("newsletter_last_dismissed");
    const lastShown = localStorage.getItem("newsletter_last_shown");
    const subscribed = localStorage.getItem("newsletter_subscribed");
    const shownThisSession = sessionStorage.getItem("newsletter_shown");

    // Don't show if permanently dismissed or already subscribed
    if (neverShow === "true" || subscribed === "true") {
      return;
    }

    // Don't show more than once per session
    if (shownThisSession === "true") {
      return;
    }

    // Check if 30 days have passed since last dismissal
    if (lastDismissed) {
      const daysSinceDismissed =
        (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) {
        return;
      }
    }

    // Check if 7 days have passed since last shown
    if (lastShown) {
      const daysSinceShown =
        (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceShown < 7) {
        return;
      }
    }

    // Show popup after 30 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("newsletter_shown", "true");
      localStorage.setItem("newsletter_last_shown", Date.now().toString());
    }, 30000); // 30 seconds

    // Exit intent detection
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !shownThisSession) {
        setIsOpen(true);
        sessionStorage.setItem("newsletter_shown", "true");
        localStorage.setItem("newsletter_last_shown", Date.now().toString());
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("newsletter_last_dismissed", Date.now().toString());
  };

  const handleNeverShow = () => {
    setIsOpen(false);
    localStorage.setItem("newsletter_never_show", "true");
    toast.success("Got it! We won't show this again.");
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setSubscribing(true);
    try {
      await newsletterAPI.subscribe(email);
      toast.success("Successfully subscribed to our newsletter!");
      localStorage.setItem("newsletter_subscribed", "true");
      setIsOpen(false);
      setEmail("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to subscribe. Please try again.",
      );
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-0"
          >
            <div className="relative bg-white shadow-2xl w-[95%] max-w-3xl h-auto overflow-hidden flex flex-col md:flex-row rounded-lg">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 z-[110] transition-colors"
                aria-label="Close"
              >
                <FiX size={28} className="text-gray-900" />
              </button>

              {/* Left Panel - Features */}
              <div className="hidden md:flex md:w-5/12 bg-secondary-600 p-8 flex-col justify-center items-center space-y-8 text-white">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-primary-500/50 flex justify-center items-center mb-3 transition-transform hover:scale-110">
                    <FiTruck className="text-primary-300" size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Free Shipping
                  </h3>
                  <p className="text-xs text-gray-400">
                    On orders over GH1,000
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-primary-500/50 flex justify-center items-center mb-3 transition-transform hover:scale-110">
                    <FiShield className="text-primary-300" size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Secure Payment
                  </h3>
                  <p className="text-xs text-gray-400">100% secure checkout</p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-primary-500/50 flex justify-center items-center mb-3 transition-transform hover:scale-110">
                    <FiHeadphones className="text-primary-300" size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    24/7 Support
                  </h3>
                  <p className="text-xs text-gray-400">Dedicated support</p>
                </div>
              </div>

              {/* Right Panel - White Form */}
              <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col items-center justify-center bg-white text-center">
                <h2 className="text-3xl md:text-4xl text-gray-800 mb-6 font-normal font-sans">
                  Welcome to Diamond Aura!
                </h2>

                <p className="text-lg font-bold text-gray-800 mb-2">
                  Subscribe to our newsletter
                </p>
                <p className="text-gray-600 mb-8 text-base">
                  and be the first one to know about our amazing deals!
                </p>

                <p className="text-xs text-gray-600 mb-6">
                  To subscribe to our newsletter, you must first read
                  <br className="hidden md:block" />
                  and agree to Diamond Aura's{" "}
                  <Link
                    href="/terms"
                    className="text-primary-600 hover:underline font-semibold"
                  >
                    I accept the Legal Terms
                  </Link>
                </p>

                <form
                  onSubmit={handleSubscribe}
                  className="w-full max-w-sm space-y-5"
                >
                  <div className="flex items-start text-left mb-6">
                    <div className="flex items-center h-5">
                      <input
                        id="privacy"
                        type="checkbox"
                        required
                        className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500 mt-0.5"
                      />
                    </div>
                    <label
                      htmlFor="privacy"
                      className="ml-3 text-xs text-gray-600 leading-tight"
                    >
                      I agree to Diamond Aura's Privacy and Cookie Policy. You
                      can unsubscribe from newsletters at any time.
                    </label>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter E-mail Address"
                      disabled={subscribing}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-sm"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-xs text-left mt-1 -translate-y-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={subscribing}
                    className={`w-full py-3 px-6 rounded text-white font-bold text-base transition-all ${
                      subscribing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-secondary-600 hover:bg-black"
                    }`}
                  >
                    {subscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
