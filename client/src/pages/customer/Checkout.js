import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiLock,
  FiCheck,
  FiChevronRight,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiTag,
  FiX,
} from "react-icons/fi";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // Get coupon data from Cart page if passed
  const passedCoupon = location.state?.coupon || null;
  const passedDiscount = location.state?.couponDiscount || 0;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [saveAddress, setSaveAddress] = useState(true);

  // Coupon state - initialize with passed data from Cart
  const [couponCode, setCouponCode] = useState(passedCoupon?.code || "");
  const [appliedCoupon, setAppliedCoupon] = useState(passedCoupon);
  const [couponDiscount, setCouponDiscount] = useState(passedDiscount);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Shipping cost calculation - ensure all values are numbers
  const subtotal = parseFloat(totalAmount) || 0;
  const shippingCost = subtotal > 50000 ? 0 : 2500;
  const tax = (subtotal - couponDiscount) * 0.075; // 7.5% VAT on discounted amount
  const finalTotal = subtotal - couponDiscount + shippingCost + tax;

  // Nigerian states
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  // Coupon functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await api.post("/coupons/validate", {
        code: couponCode.trim(),
        subtotal: subtotal,
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        setCouponDiscount(response.data.discount);
        toast.success(response.data.message);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid coupon code";
      setCouponError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
    toast.success("Coupon removed");
  };

  const validateShipping = () => {
    const required = ["firstName", "lastName", "email", "phone", "address"];
    for (const field of required) {
      if (!shippingInfo[field]) {
        toast.error(
          `Please enter your ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(shippingInfo.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handlePayment = async () => {
    // Navigate to order summary page for review
    navigate("/order-summary", {
      state: {
        orderData: {
          shippingAddress: shippingInfo,
          paymentMethod: paymentMethod,
          couponId: appliedCoupon?.id || null,
          discount: couponDiscount,
        },
        items: items,
        totalAmount: totalAmount,
        coupon: appliedCoupon,
        couponDiscount: couponDiscount,
      },
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const steps = [
    { number: 1, title: "Shipping", icon: FiTruck },
    { number: 2, title: "Payment", icon: FiCreditCard },
    { number: 3, title: "Confirm", icon: FiCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.number
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <FiCheck size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span
                    className={`ml-3 font-medium hidden sm:block ${
                      currentStep >= step.number
                        ? "text-gray-800"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${
                      currentStep > step.number
                        ? "bg-primary-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiMapPin className="text-primary-500" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={shippingInfo.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="+233256810699"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                      <textarea
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your full delivery address (e.g., House number, street name, area, city)"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Address */}
                <label className="flex items-center gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-600">
                    Save this address for future orders
                  </span>
                </label>

                {/* Continue Button */}
                <button
                  onClick={handleContinueToPayment}
                  className="w-full mt-8 py-4 btn-gradient rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <FiChevronRight />
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiCreditCard className="text-primary-500" />
                  Payment Method
                </h2>

                {/* Payment Options */}
                <div className="space-y-4 mb-8">
                  {/* Paystack */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "paystack"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png"
                          alt="Paystack"
                          className="h-8 w-8 object-contain bg-blue-500 rounded p-1"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            Pay with Paystack
                          </p>
                          <p className="text-sm text-gray-500">
                            Secure payment with cards, bank transfer, USSD
                          </p>
                        </div>
                      </div>
                    </div>
                    <FiShield className="text-green-500" size={24} />
                  </label>

                  {/* Pay on Delivery */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        Pay on Delivery
                      </p>
                      <p className="text-sm text-gray-500">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>
                </div>

                {/* Shipping Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Shipping To:
                  </h3>
                  <p className="text-gray-600">
                    {shippingInfo.firstName} {shippingInfo.lastName}
                  </p>
                  <p className="text-gray-600">{shippingInfo.address}</p>
                  <p className="text-gray-600">
                    {shippingInfo.city}, {shippingInfo.state}
                  </p>
                  <p className="text-gray-600">{shippingInfo.phone}</p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-primary-500 text-sm font-medium mt-2 hover:underline"
                  >
                    Edit Address
                  </button>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl mb-6">
                  <FiLock className="text-green-500 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-green-800">Secure Payment</p>
                    <p className="text-sm text-green-600">
                      Your payment information is encrypted and secure. We never
                      store your card details.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 py-4 btn-gradient rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="spinner w-6 h-6 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        Continue
                        <FiChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiShoppingBag className="text-primary-500" />
                Order Summary
              </h3>

              {/* Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div
                    key={`${item.product._id || item.product.id}-${item.size}-${
                      typeof item.color === "object"
                        ? item.color?.name
                        : item.color
                    }`}
                    className="flex gap-3"
                  >
                    <img
                      src={(() => {
                        const img = item.product.images?.[0];
                        if (!img) return "/placeholder.jpg";
                        const imgUrl = typeof img === "string" ? img : img.url;
                        return getImageUrl(imgUrl);
                      })()}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.size && `Size: ${item.size}`}
                        {item.color &&
                          ` • ${
                            typeof item.color === "object"
                              ? item.color.name
                              : item.color
                          }`}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                {/* Coupon Input */}
                <div className="pb-3 border-b">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTag className="inline w-4 h-4 mr-1" />
                    Coupon Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600">
                          -{formatPrice(couponDiscount)} discount
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-500 mt-1">{couponError}</p>
                  )}
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (7.5%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="gradient-text">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Free Shipping Notice */}
              {subtotal < 50000 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Add {formatPrice(50000 - subtotal)} more for free shipping!
                  </p>
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-center gap-4 text-gray-400">
                  <FiShield size={24} />
                  <FiLock size={24} />
                  <FiTruck size={24} />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Secure checkout • Fast delivery • Easy returns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
