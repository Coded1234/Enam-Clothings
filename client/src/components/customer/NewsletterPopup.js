import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMail, FiBell } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { newsletterAPI } from "../../utils/api";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const NewsletterPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const location = useLocation();
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
    if (excludedPaths.some((path) => location.pathname.startsWith(path))) {
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
  }, [location.pathname]);

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
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubscribing(true);
    try {
      await newsletterAPI.subscribe(email);
      toast.success("Successfully subscribed to our newsletter!");
      localStorage.setItem("newsletter_subscribed", "true");
      setIsOpen(false);
      setEmail("");
    } catch (error) {
      toast.error(
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-white dark:bg-secondary-600 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-primary-900 transition-colors z-10"
                aria-label="Close"
              >
                <FiX size={20} className="text-gray-600 dark:text-gold" />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-secondary-600 rounded-full mb-4"
                >
                  <FiBell className="text-primary-500" size={32} />
                </motion.div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                  Don't Miss Out!
                </h2>
                <p className="text-primary-100">
                  Subscribe to get exclusive deals, new arrivals & fashion tips
                </p>
              </div>

              {/* Form */}
              <div className="px-8 py-6">
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={subscribing}
                      style={{
                        width: "100%",
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        paddingLeft: "48px",
                        paddingRight: "16px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        outline: "none",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={subscribing}
                    className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-all ${
                      subscribing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary-500 hover:bg-primary-600 transform hover:scale-105"
                    }`}
                  >
                    {subscribing ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Subscribing...
                      </span>
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                </form>

                {/* Benefits */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-primary-300">
                    <span className="text-green-500">✓</span>
                    <span>Get 10% off your first order</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-primary-300">
                    <span className="text-green-500">✓</span>
                    <span>Early access to sales & new arrivals</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-primary-300">
                    <span className="text-green-500">✓</span>
                    <span>Exclusive fashion tips & styling advice</span>
                  </div>
                </div>

                {/* Don't show again */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-primary-700">
                  <button
                    onClick={handleNeverShow}
                    className="text-sm text-gray-500 dark:text-primary-300 hover:text-gray-700 dark:hover:text-gold transition-colors"
                  >
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
