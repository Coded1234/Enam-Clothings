import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiInstagram, FiMail, FiPhone, FiCheck } from "react-icons/fi";
import { SiTiktok } from "react-icons/si";
import { newsletterAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setSubscribing(true);
    try {
      await newsletterAPI.subscribe(email);
      toast.success("Successfully subscribed to newsletter!");
      setSubscribed(true);
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter - Hidden on mobile, visible on desktop */}
      <div className="hidden md:block bg-gradient-to-r from-primary-500 to-secondary-500 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">
            Subscribe to our Newsletter
          </h3>
          <p className="text-white/80 mb-6">
            Get updates on new arrivals and exclusive offers
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white">
              <FiCheck size={24} />
              <span className="text-lg font-medium">
                Thanks for subscribing!
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                style={{ backgroundColor: 'white', color: 'black' }}
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <img
              src="/images/loginlogo.png"
              alt="The Fashion Gallery"
              className="h-10 w-auto object-contain mb-5"
            />
            <p className="text-gray-300 mb-4">
              Your one-stop destination for premium fashion and clothing.
              Quality meets style.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors"
                aria-label="TikTok"
              >
                <SiTiktok />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/shop"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  to="/shop/men"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  to="/shop/women"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Women
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/orders"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/size-guide"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Size Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-300">
                <FiPhone className="text-primary-500" />
                <span>+233200620026</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <FiMail className="text-primary-500" />
                <span>thefashiongallery264@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-300 text-sm">
            © 2026 The Fashion Gallery. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-300">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
