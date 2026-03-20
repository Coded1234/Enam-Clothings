"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  FiMail,
  FiPhone,
  FiSend,
  FiMessageSquare,
  FiInstagram,
} from "react-icons/fi";
import { SiTiktok } from "react-icons/si";
import api from "../../utils/api";
import toast from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    returnReason: "",
    message: "",
  });
  const [attachments, setAttachments] = useState([]);
  const searchParams = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
  const allowedAttachmentTypes = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAttachmentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!allowedAttachmentTypes.has(file.type)) {
        toast.error("Only JPG, PNG, or PDF files are allowed");
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        toast.error("Each attachment must be 5MB or less");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles]);
    }

    // Allow re-selecting the same file after removal.
    e.target.value = "";
  };

  const removeAttachmentAtIndex = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isReturnRequest = formData.subject === "Returns & Refunds";

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isReturnRequest && !formData.returnReason.trim()) {
      toast.error("Please provide a reason for your return");
      return;
    }

    setLoading(true);
    try {
      const orderId = searchParams.get("orderId") || "";
      const orderNumber = searchParams.get("orderNumber") || "";
      const shouldIncludeOrder = Boolean(orderId || orderNumber);

      let composedMessage = formData.message;
      if (isReturnRequest && formData.returnReason.trim()) {
        const reasonLine = `Return Reason: ${formData.returnReason.trim()}`;
        if (!composedMessage.includes(reasonLine)) {
          composedMessage = `${reasonLine}\n\n${composedMessage}`;
        }
      }
      if (shouldIncludeOrder) {
        const headerLines = [
          orderNumber ? `Order Number: ${orderNumber}` : null,
          orderId ? `Order ID: ${orderId}` : null,
        ].filter(Boolean);

        const header = headerLines.join("\n");
        if (header && !composedMessage.includes(headerLines[0])) {
          composedMessage = `${header}\n\n${composedMessage}`;
        }
      }

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("phone", formData.phone);
      payload.append("subject", formData.subject);
      payload.append("message", composedMessage);

      if (orderId) payload.append("orderId", orderId);
      if (orderNumber) payload.append("orderNumber", orderNumber);

      attachments.forEach((file) => payload.append("attachments", file));

      await api.post("/contact", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
    if (searchParams.get("subject")) {
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

      const incoming = searchParams.get("subject");
      const mapped = subjectMap[incoming] || incoming;
      setFormData((prev) => ({ ...prev, subject: mapped }));
    }

    // If this page was opened as a return request, prefill a structured template.
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const isReturnFlow = Boolean(orderId || orderNumber);
    if (isReturnFlow) {
      setFormData((prev) => {
        const next = { ...prev };

        if (!next.subject || next.subject.trim() === "") {
          next.subject = "Returns & Refunds";
        }

        const headerLines = [
          orderNumber ? `Order Number: ${orderNumber}` : null,
          orderId ? `Order ID: ${orderId}` : null,
        ].filter(Boolean);
        const header = headerLines.join("\n");

        if (!next.message || next.message.trim() === "") {
          next.message = `${header}${header ? "\n\n" : ""}Items to return:\n- \n\nPreferred resolution (Refund/Exchange):\n\nAdditional details:`;
        } else if (header && !next.message.includes(headerLines[0])) {
          next.message = `${header}\n\n${next.message}`;
        }

        return next;
      });
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
  }, [user, searchParams]);

  const contactInfo = [
    {
      icon: FiPhone,
      title: "Call Us",
      details: ["+233 25 681 0699"],
    },
    {
      icon: FiMail,
      title: "Email Us",
      details: ["diamondauragallery@gmail.com"],
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gold-light mb-4">
              Message Sent!
            </h2>
            <p className="text-gray-600 dark:text-gold mb-6">
              Thank you for contacting us. We've received your message and will
              get back to you within 24-48 hours.
            </p>
            <p className="text-sm text-gray-500 dark:text-primary-300 mb-8">
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
                    returnReason: "",
                    message: "",
                  });
                  setAttachments([]);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-primary-700 rounded-lg text-gray-700 dark:text-gold-light hover:bg-gray-50 dark:hover:bg-opacity-5 transition-colors"
              >
                Send Another Message
              </button>
              <Link
                href="/"
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
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Contact Us</h1>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
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
                <h3 className="font-semibold text-gray-800 dark:text-gold-light mb-2">
                  {info.title}
                </h3>
                {info.details.map((detail, i) => (
                  <p
                    key={i}
                    className="text-gray-600 dark:text-primary-300 text-sm"
                  >
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
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gold-light mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 dark:text-primary-300 mb-6">
                Fill out the form below and we'll get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+233 XX XXX XXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
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

                {formData.subject === "Returns & Refunds" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                      Reason for Return <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="returnReason"
                      value={formData.returnReason}
                      onChange={handleChange}
                      placeholder="Tell us why you want to return the item"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black bg-white"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-black placeholder-black bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                    Attachments (optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleAttachmentsChange}
                    className="w-full text-sm text-gray-700 dark:text-gold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-white/60">
                    Allowed: JPG, PNG, PDF. Max 5MB per file.
                  </p>

                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gold-light truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/60">
                              {(file.size / (1024 * 1024)).toFixed(2)}MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachmentAtIndex(index)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <h3 className="font-semibold text-gray-800 dark:text-gold-light mb-2">
                  Looking for Quick Answers?
                </h3>
                <p className="text-gray-600 dark:text-primary-300 mb-4">
                  Check out our FAQ page for answers to commonly asked
                  questions.
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 text-primary-500 font-medium hover:text-primary-600"
                >
                  Visit FAQ Page →
                </Link>
              </div>

              {/* Prefill subject if navigated with state */}
              {/* useEffect will have already set the subject on mount */}

              {/* Social Links */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gold-light mb-4">
                  Follow Us
                </h3>
                <p className="text-gray-600 dark:text-primary-300 mb-4">
                  Stay connected with us on social media for updates,
                  promotions, and more.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://www.tiktok.com/@enamdiamond?_r=1&_t=ZS-9429LMlZZmE"
                    className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                  >
                    <SiTiktok size={18} />
                  </a>
                  <a
                    href="https://www.instagram.com/diamondauragallery/?hl=it"
                    target="_blank"
                    rel="noopener noreferrer"
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
