import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSend,
  FiMessageSquare,
  FiFacebook,
  FiTwitter,
  FiInstagram,
} from "react-icons/fi";
import api from "../../utils/api";
import toast from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/contact", formData);
      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prefill subject from navigation state (FAQ link)
    if (location?.state?.subject) {
      const subjectMap = {
        "Orders & Tracking": "Order Inquiry",
        "Shipping & Delivery": "Shipping",
        "Returns & Exchanges": "Returns & Refunds",
        "Payment & Pricing": "Payment & Pricing",
        "Account & Profile": "Order Inquiry",
        "Security & Privacy": "Technical Support",
        "All Questions": "Other",
        Support: "Other",
      };

      const incoming = location.state.subject;
      const mapped = subjectMap[incoming] || incoming;
      setFormData((prev) => ({ ...prev, subject: mapped }));
    }

    // Prefill name/email/phone from logged-in user if available and fields are empty
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name:
          prev.name && prev.name.trim()
            ? prev.name
            : user.firstName || user.lastName
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : prev.name,
        email:
          prev.email && prev.email.trim()
            ? prev.email
            : user.email || prev.email,
        phone:
          prev.phone && prev.phone.trim()
            ? prev.phone
            : user.phone || prev.phone,
      }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const contactInfo = [
    {
      icon: FiPhone,
      title: "Call Us",
      details: ["+233 25 681 0699"],
    },
    {
      icon: FiMail,
      title: "Email Us",
      details: ["thefashiongallery264@gmail.com"],
    },
    {
      icon: FiClock,
      title: "Working Hours",
      details: [
        "Monday - Friday: 9AM - 6PM",
        "Saturday: 10AM - 4PM",
        "Sunday: Closed",
      ],
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white dark:bg-surface rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Message Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for contacting us. We've received your message and will
              get back to you within 24-48 hours.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              A confirmation email has been sent to{" "}
              <strong>{formData.email}</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                  });
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-opacity-5 transition-colors"
              >
                Send Another Message
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Reach out and
            we'll respond as soon as we can.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white dark:bg-surface rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <info.icon className="text-primary-500" size={24} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {info.title}
                </h3>
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-600 text-sm">
                    {detail}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 mb-6">
                Fill out the form below and we'll get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233 XX XXX XXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Product Question">Product Question</option>
                      <option value="Returns & Refunds">
                        Returns & Refunds
                      </option>
                      <option value="Shipping">Shipping</option>
                      <option value="Technical Support">
                        Technical Support
                      </option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    loading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Additional Info */}
            <div className="space-y-6">
              {/* FAQ Link */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Looking for Quick Answers?
                </h3>
                <p className="text-gray-600 mb-4">
                  Check out our FAQ page for answers to commonly asked
                  questions.
                </p>
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-primary-500 font-medium hover:text-primary-600"
                >
                  Visit FAQ Page →
                </Link>
              </div>

              {/* Prefill subject if navigated with state */}
              {/* useEffect will have already set the subject on mount */}

              {/* Social Links */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Follow Us</h3>
                <p className="text-gray-600 mb-4">
                  Stay connected with us on social media for updates,
                  promotions, and more.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    <FiFacebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white hover:bg-sky-600 transition-colors"
                  >
                    <FiTwitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                  >
                    <FiInstagram size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
