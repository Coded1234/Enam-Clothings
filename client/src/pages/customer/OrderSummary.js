import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchCart } from "../../redux/slices/cartSlice";
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
} from "react-icons/fi";

const OrderSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    orderData,
    items,
    totalAmount,
    coupon,
    couponDiscount,
    shippingCost: passedShippingCost,
    shippingDetails,
  } = location.state || {};
  const [loading, setLoading] = useState(false);

  // If no data, redirect back to checkout
  if (!orderData || !items) {
    navigate("/checkout");
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  const subtotal = parseFloat(totalAmount) || 0;
  const discount = parseFloat(couponDiscount) || 0;
  const shippingCost = parseFloat(passedShippingCost) || 0;
  const tax = (subtotal - discount) * 0.0; // Tax included in prices
  const finalTotal = subtotal - discount + shippingCost + tax;

  const handleConfirmOrder = async () => {
    setLoading(true);

    try {
      // Prepare order data with proper structure
      const finalOrderData = {
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        shippingDetails: shippingDetails || orderData.shippingDetails,
        couponId: coupon?.id || null,
        discount: discount,
      };

      // Create order
      const response = await api.post("/orders", finalOrderData);
      const order = response.data;

      if (!order || !order.id) {
        throw new Error("Order creation failed");
      }

      // Record coupon usage if coupon was applied
      if (coupon) {
        try {
          await api.post("/coupons/record-usage", {
            coupon_id: coupon.id,
            order_id: order.id,
          });
        } catch (couponError) {
          console.error("Failed to record coupon usage:", couponError);
          // Don't fail the order for coupon usage recording
        }
      }

      // Handle payment based on method
      if (orderData.paymentMethod === "paystack") {
        // Initialize Paystack payment
        const paymentResponse = await api.post("/payment/initialize", {
          email: orderData.shippingAddress.email,
          amount: finalTotal,
          metadata: {
            order_id: order.id,
            customer_name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
            customer_phone: orderData.shippingAddress.phone,
          },
        });

        if (paymentResponse.data.status && paymentResponse.data.data) {
          // Redirect to Paystack payment page
          window.location.href = paymentResponse.data.data.authorization_url;
        } else {
          throw new Error("Payment initialization failed");
        }
      } else {
        // For COD and Bank Transfer, just refresh cart and redirect
        await dispatch(fetchCart());
        toast.success("Order confirmed successfully!");
        navigate("/orders");
      }
    } catch (error) {
      console.error("Order error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Order creation failed";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/checkout")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Checkout</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {orderData.shippingAddress.address}
                    </p>
                    {orderData.shippingAddress.addressDetails && (
                      <p className="text-gray-700 text-sm mt-1">
                        {orderData.shippingAddress.addressDetails}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiPhone className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">
                      {orderData.shippingAddress.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiMail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">
                      {orderData.shippingAddress.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Method
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    orderData.paymentMethod === "cod"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <FiCreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {orderData.paymentMethod === "cod"
                      ? "Pay on Delivery"
                      : "Paystack (Card/Mobile Money)"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {orderData.paymentMethod === "cod"
                      ? "Pay when you receive your order"
                      : "Secure online payment"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
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
                        <h3 className="font-medium text-gray-900">
                          {item.product?.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-500">
                            Size: {item.size}
                          </p>
                          {getColorName() && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              Color:
                              {getColorCode() && (
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: getColorCode() }}
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
                        <p className="font-semibold text-gray-900">
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
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Summary
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      Coupon ({coupon?.code})
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
                    <span className="text-2xl font-bold text-blue-600">
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
                    <span>
                      {orderData.paymentMethod === "paystack"
                        ? "Proceed to Payment"
                        : "Confirm Order"}
                    </span>
                  </>
                )}
              </button>

              {/* Payment Method Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  {orderData.paymentMethod === "paystack" && (
                    <>
                      You will be redirected to Paystack secure payment gateway
                      to complete your payment.
                    </>
                  )}
                  {orderData.paymentMethod === "cod" && (
                    <>Please have exact cash ready when your order arrives.</>
                  )}
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
