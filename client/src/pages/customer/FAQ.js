import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiPackage,
  FiTruck,
  FiRefreshCw,
  FiCreditCard,
  FiUser,
  FiShield,
} from "react-icons/fi";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState({});

  const categories = [
    { id: "all", name: "All Questions", icon: FiSearch },
    { id: "orders", name: "Orders & Tracking", icon: FiPackage },
    { id: "shipping", name: "Shipping & Delivery", icon: FiTruck },
    { id: "returns", name: "Returns & Exchanges", icon: FiRefreshCw },
    { id: "payment", name: "Payment & Pricing", icon: FiCreditCard },
    { id: "account", name: "Account & Profile", icon: FiUser },
    { id: "security", name: "Security & Privacy", icon: FiShield },
  ];

  const faqData = [
    // Orders & Tracking
    {
      id: 1,
      category: "orders",
      question: "How can I track my order?",
      answer:
        "You can track your order by logging into your account and visiting the \"Orders\" section. Each order has a status indicator showing whether it's Pending, Confirmed, Shipped, or Delivered. You'll also receive email updates when your order status changes.",
    },
    {
      id: 2,
      category: "orders",
      question: "How do I cancel my order?",
      answer:
        "You can cancel your order as long as it hasn't been shipped yet. Go to your Orders page, find the order you want to cancel, and click the \"Cancel Order\" button. If the order has already been shipped, you'll need to wait for delivery and then initiate a return.",
    },
    {
      id: 3,
      category: "orders",
      question: "Can I modify my order after placing it?",
      answer:
        "Once an order is placed, modifications are limited. If you need to change your order, please contact our customer support as soon as possible. We can help if the order hasn't been processed yet. Otherwise, you may need to cancel and place a new order.",
    },
    {
      id: 4,
      category: "orders",
      question: "What does each order status mean?",
      answer:
        "Pending: Your order has been received and is awaiting confirmation. Confirmed: Your order has been verified and is being prepared. Shipped: Your order is on its way to you. Delivered: Your order has been delivered successfully. Cancelled: The order has been cancelled.",
    },

    // Shipping & Delivery
    {
      id: 5,
      category: "shipping",
      question: "What are the shipping options and costs?",
      answer:
        "We offer standard shipping at GH₵ 15.00 for orders under GH₵ 500. Orders above GH₵ 500 qualify for free shipping. Standard delivery typically takes 3-5 business days within Ghana. Express shipping options may be available at checkout for faster delivery.",
    },
    {
      id: 6,
      category: "shipping",
      question: "Do you ship internationally?",
      answer:
        "Currently, we only ship within Ghana. We're working on expanding our shipping to other countries in West Africa soon. Sign up for our newsletter to be notified when international shipping becomes available.",
    },
    {
      id: 7,
      category: "shipping",
      question: "How long does delivery take?",
      answer:
        "Standard delivery within Accra takes 1-2 business days. Delivery to other major cities typically takes 2-4 business days. Rural areas may take 4-7 business days. Please note that these are estimates and actual delivery times may vary.",
    },
    {
      id: 8,
      category: "shipping",
      question: "What happens if I'm not home during delivery?",
      answer:
        "Our delivery partners will attempt to contact you before delivery. If you're not available, they may leave the package with a neighbor or at a safe location. You can also provide specific delivery instructions during checkout.",
    },

    // Returns & Exchanges
    {
      id: 9,
      category: "returns",
      question: "What is your return policy?",
      answer:
        "We accept returns within 14 days of delivery for unused items in their original packaging with tags attached. Items must be in the same condition as received. Some items like underwear, swimwear, and personalized items cannot be returned for hygiene reasons.",
    },
    {
      id: 10,
      category: "returns",
      question: "How do I initiate a return?",
      answer:
        'To initiate a return, go to your Orders page, select the order containing the item you want to return, and click "Request Return". Fill out the return form with the reason for return. Once approved, you\'ll receive instructions on how to ship the item back.',
    },
    {
      id: 11,
      category: "returns",
      question: "Can I exchange an item for a different size or color?",
      answer:
        'Yes! If you need a different size or color, you can request an exchange through your Orders page. Select the item and choose "Exchange" instead of "Return". If the desired size/color is available, we\'ll process the exchange. If not, we\'ll issue a refund.',
    },
    {
      id: 12,
      category: "returns",
      question: "How long does it take to receive my refund?",
      answer:
        "Once we receive and inspect your returned item, refunds are processed within 3-5 business days. The refund will be credited to your original payment method. Mobile money refunds are typically faster than bank transfers.",
    },

    // Payment & Pricing
    {
      id: 13,
      category: "payment",
      question: "What payment methods do you accept?",
      answer:
        "We accept Pay on Delivery (Cash on Delivery) for your convenience. You can pay with cash or mobile money when your order arrives. We're working on adding online payment options including mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money) and card payments soon.",
    },
    {
      id: 14,
      category: "payment",
      question: "Are prices inclusive of tax?",
      answer:
        "Yes, all prices displayed on our website are inclusive of applicable taxes. The price you see is the price you pay. There are no hidden fees or additional taxes at checkout.",
    },
    {
      id: 15,
      category: "payment",
      question: "Do you offer discounts or promotions?",
      answer:
        "Yes! We regularly offer discounts and promotions. Subscribe to our newsletter and follow us on social media to stay updated on the latest deals. First-time customers may receive a special welcome discount.",
    },
    {
      id: 16,
      category: "payment",
      question: "Is Pay on Delivery available for all locations?",
      answer:
        "Pay on Delivery is available for most locations within Ghana. However, some remote areas may have restrictions. You'll see the available payment options for your delivery address during checkout.",
    },

    // Account & Profile
    {
      id: 17,
      category: "account",
      question: "How do I create an account?",
      answer:
        'Click on the "Sign Up" or "Register" button at the top of the page. Fill in your details including name, email, and password. You\'ll receive a confirmation email to verify your account. Once verified, you can start shopping!',
    },
    {
      id: 18,
      category: "account",
      question: "How do I reset my password?",
      answer:
        'If you\'ve forgotten your password, click on "Login" and then "Forgot Password". Enter your email address and we\'ll send you a link to reset your password. The link expires in 24 hours for security reasons.',
    },
    {
      id: 19,
      category: "account",
      question: "How do I update my profile information?",
      answer:
        'Log into your account and go to the "Profile" page. Here you can update your name, email, phone number, and shipping address. You can also upload a profile picture and change your password from this page.',
    },
    {
      id: 20,
      category: "account",
      question: "Can I have multiple shipping addresses?",
      answer:
        "Currently, you can save one primary shipping address in your profile. However, you can enter a different shipping address during checkout for individual orders without changing your saved address.",
    },

    // Security & Privacy
    {
      id: 21,
      category: "security",
      question: "Is my personal information secure?",
      answer:
        "Yes, we take data security seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent. Our website uses SSL encryption for all transactions.",
    },
    {
      id: 22,
      category: "security",
      question: "How do you use my data?",
      answer:
        "We use your data to process orders, provide customer support, and improve your shopping experience. This includes sending order updates, personalized recommendations, and promotional emails (which you can opt out of).",
    },
    {
      id: 23,
      category: "security",
      question: "Can I delete my account?",
      answer:
        "Yes, you can request account deletion by contacting our customer support. Please note that we may retain certain information for legal and business purposes, but your personal data will be anonymized.",
    },
    {
      id: 24,
      category: "security",
      question: "How can I unsubscribe from promotional emails?",
      answer:
        'Every promotional email we send includes an "Unsubscribe" link at the bottom. Click it to opt out of marketing emails. You\'ll still receive important transactional emails like order confirmations and shipping updates.',
    },
  ];

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about orders, shipping, returns,
            payments, and more. Can't find what you're looking for? Contact our
            support team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Category Tabs (inline nav with underline indicator) */}
        <div className="mb-8">
          <nav className="flex overflow-x-auto sm:justify-center border-b border-gray-200 -mx-4 sm:mx-0 hide-scrollbar">
            <div className="inline-flex gap-6 px-4 py-2 whitespace-nowrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  aria-current={
                    activeCategory === category.id ? "page" : undefined
                  }
                  className={`pb-3 text-sm font-medium transition-colors focus:outline-none ${
                    activeCategory === category.id
                      ? "text-primary-500 border-b-2 border-primary-500"
                      : "text-gray-600 hover:text-primary-500"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No results found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or browse a different category
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    {openItems[faq.id] ? (
                      <FiChevronUp className="text-primary-600 text-xl flex-shrink-0" />
                    ) : (
                      <FiChevronDown className="text-gray-400 text-xl flex-shrink-0" />
                    )}
                  </button>
                  {openItems[faq.id] && (
                    <div className="px-6 pb-5">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-primary-100 mb-6 max-w-lg mx-auto">
              Our customer support team is here to help. Reach out to us and
              we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/contact"
                state={{
                  subject:
                    categories.find((c) => c.id === activeCategory)?.name ||
                    "Support",
                }}
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Email Support
              </Link>
              <a
                href="tel:+233256810699"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
              >
                Call Us: +233 256 810 699
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
