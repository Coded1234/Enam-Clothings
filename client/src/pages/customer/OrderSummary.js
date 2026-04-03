"use client";
/* eslint-env browser */
/* eslint-disable no-unused-vars */
/* global sessionStorage, Intl */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getImageUrl } from "../../utils/imageUrl";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiShoppingBag,
  FiCreditCard,
  FiShield,
  FiUser,
} from "react-icons/fi";

const OrderSummary = () => {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const _oState =
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("orderSummaryState") || "{}")
      : {};
  const {
    orderData,
    items,
    totalAmount,
    coupon: initialCoupon,
    couponDiscount: initialCouponDiscount,
    shippingCost: passedShippingCost,
    shippingDetails,
  } = _oState;
  const [loading, setLoading] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState(initialCoupon || null);
  const [discount, setDiscount] = useState(
    parseFloat(initialCouponDiscount) || 0,
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Personal information state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: orderData?.shippingAddress?.firstName || "",
    lastName: orderData?.shippingAddress?.lastName || "",
    email: orderData?.shippingAddress?.email || "",
    phone: orderData?.shippingAddress?.phone || "",
  });
  const [formErrors, setFormErrors] = useState({});

  const paymentMethod = "paystack";

  // Redirect only on the client after mount when summary state is missing.
  useEffect(() => {
    if (!orderData || !items) {
      router.replace("/checkout");
    }
  }, [orderData, items, router]);

  if (!orderData || !items) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const isPerfumeItem = (item) => {
    const category =
      item?.product?.category || item?.productCategory || item?.category;
    const normalizedCategory = String(category || "").toLowerCase();
    return (
      normalizedCategory === "perfume" || normalizedCategory === "perfumes"
    );
  };

  const hasDisplaySize = (item) => {
    const size = String(item?.size || "")
      .trim()
      .toLowerCase();
    return size && size !== "n/a" && size !== "na" && size !== "none";
  };

  const subtotal = parseFloat(totalAmount) || 0;

  // Enforce free shipping in UI for subtotal >= GH₵1000
  const shippingCost =
    subtotal >= 1000 ? 0 : parseFloat(passedShippingCost) || 0;
  const tax = (subtotal - discount) * 0.0; // Tax included in prices
  const finalTotal = subtotal - discount + shippingCost + tax;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to apply coupon");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await api.post("/coupons/validate", {
        code: couponCodeInput.trim(),
        subtotal: subtotal,
      });

      if (response.data.success) {
        setActiveCoupon(response.data.coupon);
        setDiscount(parseFloat(response.data.discount));
        // Update session storage to persist across reloads
        const currentState = JSON.parse(
          sessionStorage.getItem("orderSummaryState") || "{}",
        );
        currentState.coupon = response.data.coupon;
        currentState.couponDiscount = response.data.discount;
        sessionStorage.setItem(
          "orderSummaryState",
          JSON.stringify(currentState),
        );
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
    setActiveCoupon(null);
    setDiscount(0);
    // Update session storage
    const currentState = JSON.parse(
      sessionStorage.getItem("orderSummaryState") || "{}",
    );
    delete currentState.coupon;
    delete currentState.couponDiscount;
    sessionStorage.setItem("orderSummaryState", JSON.stringify(currentState));
    setCouponCodeInput("");
    setCouponError("");
    toast.success("Coupon removed");
  };

  const handleConfirmOrder = async () => {
    setFormErrors({});
    let errors = {};

    if (!personalInfo.firstName || personalInfo.firstName.trim() === "") {
      errors.firstName = "Please enter your first name";
    }
    if (!personalInfo.lastName || personalInfo.lastName.trim() === "") {
      errors.lastName = "Please enter your last name";
    }
    if (!personalInfo.email || personalInfo.email.trim() === "") {
      errors.email = "Please enter your email address";
    } else if (!/^\S+@\S+\.\S+$/.test(personalInfo.email)) {
      errors.email = "Please enter a valid email address";
    }

    const phoneStr = personalInfo.phone.trim().replace(/\s+/g, "");
    const phoneRegex = /^(02[0345678]|05[0345679])\d{7}$/;

    if (!personalInfo.phone || personalInfo.phone.trim() === "") {
      errors.phone = "Please enter your phone number";
    } else if (!phoneRegex.test(phoneStr)) {
      errors.phone = "Invalid number format. e.g. 0540000000";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const baseShippingAddress = orderData?.shippingAddress || {};
    const shippingAddress = {
      ...baseShippingAddress,
      firstName: personalInfo.firstName.trim(),
      lastName: personalInfo.lastName.trim(),
      email: (personalInfo.email || "").trim(),
      phone: phoneStr,
      address: String(baseShippingAddress.address || "").trim(),
      city: String(baseShippingAddress.city || "").trim(),
      region: String(baseShippingAddress.region || "").trim(),
      country: String(baseShippingAddress.country || "Ghana").trim(),
      postalCode: String(baseShippingAddress.postalCode || "").trim(),
    };

    if (!shippingAddress.address || shippingAddress.address.length < 2) {
      toast.error("Please go back and provide a valid delivery address");
      return;
    }

    if (!shippingAddress.city) {
      toast.error("Please go back and provide your city");
      return;
    }

    const storedSessionId =
      typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;
    let effectiveSessionId = storedSessionId;
    if (!effectiveSessionId && typeof window !== "undefined") {
      effectiveSessionId =
        window.crypto?.randomUUID?.() ||
        `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem("sessionId", effectiveSessionId);
    }

    setLoading(true);

    try {
      // Prepare order data with proper structure
      const finalOrderData = {
        shippingAddress,
        paymentMethod,
        couponId: activeCoupon?.id ? String(activeCoupon.id) : null,
        discount: discount,
        sessionId: effectiveSessionId || null,
        guestEmail: isAuthenticated ? null : shippingAddress.email || null,
        guestName: isAuthenticated
          ? null
          : `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
      };

      const finalShippingDetails = shippingDetails || orderData.shippingDetails;
      if (finalShippingDetails) {
        finalOrderData.shippingDetails = finalShippingDetails;
      }

      // Create order
      const response = await api.post("/orders", finalOrderData, {
        headers: effectiveSessionId
          ? { "x-session-id": effectiveSessionId }
          : undefined,
      });
      const order = response.data;

      if (!order || !order.id) {
        throw new Error("Order creation failed");
      }

      // Record coupon usage if coupon was applied
      if (activeCoupon) {
        try {
          await api.post("/coupons/record-usage", {
            coupon_id: activeCoupon.id,
            order_id: order.id,
          });
        } catch (couponError) {
          console.error("Failed to record coupon usage:", couponError);
          // Don't fail the order for coupon usage recording
        }
      }

      // Initialize Paystack payment using server-authoritative order totals.
      const paymentEmail =
        order?.user?.email ||
        order?.guestEmail ||
        shippingAddress.email ||
        (personalInfo.email || "").trim();

      if (!paymentEmail) {
        throw new Error("A valid email is required to continue payment");
      }

      const paymentResponse = await api.post("/payment/initialize", {
        email: paymentEmail,
        metadata: {
          order_id: order.id,
          customer_name: `${personalInfo.firstName} ${personalInfo.lastName}`,
          customer_phone: personalInfo.phone,
        },
      });

      if (paymentResponse.data.status && paymentResponse.data.data) {
        // Redirect to Paystack payment page
        const authUrl = paymentResponse.data.data.authorization_url;
        if (authUrl && authUrl.startsWith("https://")) {
          window.location.href = authUrl;
        } else {
          throw new Error("Invalid payment URL received");
        }
      } else {
        throw new Error("Payment initialization failed");
      }
    } catch (error) {
      console.error("Order error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      const backendMessage =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message;
      const validationDetail = Array.isArray(error.response?.data?.errors)
        ? error.response.data.errors[0]?.message
        : null;

      let errorMessage =
        backendMessage || error.message || "Order creation failed";
      // Prefer specific validation detail from Joi over generic validation messages
      if (
        (backendMessage === "Validation error" ||
          backendMessage === "Validation failed") &&
        validationDetail
      ) {
        errorMessage = validationDetail;
      } else if (validationDetail && !backendMessage) {
        errorMessage = validationDetail;
      }

      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/checkout")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gold-light">
            Order Summary
          </h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-surface rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gold-light">
                  Personal Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => {
                        setPersonalInfo({
                          ...personalInfo,
                          firstName: e.target.value,
                        });
                      }}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black ${formErrors.firstName ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter First Name"
                      required
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => {
                      setPersonalInfo({
                        ...personalInfo,
                        lastName: e.target.value,
                      });
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black ${formErrors.lastName ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Enter Last Name"
                    required
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
                {isAuthenticated && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={personalInfo.email}
                        onChange={(e) => {
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          });
                        }}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black ${formErrors.email ? "border-red-500" : "border-gray-300"}`}
                        placeholder="john@example.com"
                        required={isAuthenticated}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gold mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={personalInfo.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setPersonalInfo({
                          ...personalInfo,
                          phone: val,
                        });
                      }}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-black placeholder-black ${formErrors.phone ? "border-red-500" : "border-gray-300"}`}
                      placeholder="e.g., 0540000000"
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white dark:bg-surface rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gold-light">
                  Shipping Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 dark:text-gold-light">
                      {orderData.shippingAddress.address}
                    </p>
                    {orderData.shippingAddress.addressDetails && (
                      <p className="text-gray-700 text-sm mt-1">
                        {orderData.shippingAddress.addressDetails}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-surface rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gold-light">
                  Payment Method *
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded">
                        <FiCreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gold-light">
                          Pay with Paystack
                        </p>
                        <p className="text-sm text-gray-500">
                          Card and mobile money payments
                        </p>
                      </div>
                    </div>
                  </div>
                  <FiShield className="text-green-500" size={24} />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-surface rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiShoppingBag className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Order Items
                </h2>
              </div>
              <div className="space-y-4">
                {items.map((item) => {
                  // Get image URL - handle both string and object formats
                  const getItemImage = () => {
                    const images = item.product?.images;
                    if (!images || images.length === 0)
                      return "/placeholder.jpg";
                    const firstImage = images[0];
                    const imgUrl =
                      typeof firstImage === "string"
                        ? firstImage
                        : firstImage?.url;
                    return getImageUrl(imgUrl);
                  };

                  // Get color name - handle both string and object formats
                  const getColorName = () => {
                    if (!item.color) return null;
                    if (typeof item.color === "string") return item.color;
                    return item.color?.name || null;
                  };

                  const getColorCode = () => {
                    if (!item.color || typeof item.color === "string")
                      return null;
                    return item.color?.code || null;
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
                    >
                      <img
                        src={getItemImage()}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gold-light">
                          {item.product?.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {!isPerfumeItem(item) && hasDisplaySize(item) && (
                            <p className="text-sm text-gray-500">
                              Size: {item.size}
                            </p>
                          )}
                          {getColorName() && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              Color:
                              {getColorCode() && (
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: getColorCode(),
                                  }}
                                ></span>
                              )}
                              {getColorName()}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gold-light">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gold-light">
                  Payment Summary
                </h2>
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                {activeCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-green-700 font-medium text-sm min-w-0 break-words">
                      {activeCoupon.code} applied
                    </span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) =>
                        setCouponCodeInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                      placeholder="Enter coupon code"
                      className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black placeholder-black focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1 text-red-500 text-xs">{couponError}</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-primary-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      Coupon ({activeCoupon?.code})
                    </span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>

              {/* Payment Method Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  You will be redirected to Paystack secure payment gateway to
                  complete your payment.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <FiShield className="w-4 h-4" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
