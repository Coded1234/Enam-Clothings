import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiBell, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { newsletterAPI } from "../../utils/api";
import { Link } from "react-router-dom";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

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

    if (!agreed) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setSubscribing(true);
    try {
      await newsletterAPI.subscribe(email);
      toast.success("Successfully subscribed to our newsletter!");
      setSubscribed(true);
      setEmail("");
      setAgreed(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-secondary-600 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-secondary-600 rounded-full mb-6"
            >
              <FiBell className="text-primary-500" size={40} />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Stay in the Loop
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto">
              Subscribe to our newsletter and be the first to know about new
              arrivals, exclusive deals, and fashion tips.
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-12">
            {subscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <FiCheckCircle
                  className="text-green-500 mx-auto mb-6"
                  size={80}
                />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome Aboard!
                </h2>
                <p className="text-gray-600 dark:text-gold text-lg mb-8">
                  You're now subscribed to our newsletter. Check your inbox for
                  exciting updates!
                </p>
                <Link
                  to="/"
                  className="inline-block px-8 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </motion.div>
            ) : (
              <>
                {/* Benefits Section */}
                <div className="mb-8">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Why Subscribe?
                  </h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🎁</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Exclusive Deals
                      </h3>
                      <p className="hidden md:block text-gray-600 dark:text-primary-300 text-sm">
                        Get access to subscriber-only discounts and offers
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">✨</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        New Arrivals
                      </h3>
                      <p className="hidden md:block text-gray-600 dark:text-primary-300 text-sm">
                        Be the first to discover our latest collections
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">💡</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Fashion Tips
                      </h3>
                      <p className="hidden md:block text-gray-600 dark:text-primary-300 text-sm">
                        Receive expert styling advice and fashion insights
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Form */}
                <form onSubmit={handleSubscribe} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gold mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" size={20} />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
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
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="agree"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-secondary-700 dark:border-primary-600"
                        disabled={subscribing}
                      />
                    </div>
                    <label
                      htmlFor="agree"
                      className="ml-3 text-sm text-gray-700 dark:text-gold"
                    >
                      I agree to The Fashion Gallery terms and conditions. You
                      can unsubscribe at anytime.
                    </label>
                  </div>

                  {/* Privacy Policy Link */}
                  <div className="text-sm text-gray-600 dark:text-primary-300">
                    <p>
                      By subscribing, you agree to our{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-primary-500 hover:text-primary-600 underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/terms"
                        className="text-primary-500 hover:text-primary-600 underline"
                      >
                        Terms of Service
                      </Link>
                      .
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={subscribing}
                    className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all ${
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
                      "Subscribe to Newsletter"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>

        {/* Additional Info */}
        {!subscribed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600 dark:text-primary-300 text-sm">
              We respect your privacy. We'll never share your email with third
              parties.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Newsletter;
