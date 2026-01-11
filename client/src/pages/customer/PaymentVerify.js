import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../../redux/slices/cartSlice";
import api from "../../utils/api";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiShoppingBag,
  FiHome,
  FiMail,
} from "react-icons/fi";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("verifying"); // verifying, success, failed
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");

  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentRef = reference || trxref;

      if (!paymentRef) {
        setStatus("failed");
        setMessage("No payment reference found");
        return;
      }

      try {
        const { data } = await api.get(`/payment/verify/${paymentRef}`);

        if (data.success) {
          setStatus("success");
          setOrder(data.order);
          setMessage(data.message || "Payment successful!");
          dispatch(clearCart());
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");
        setMessage(
          error.response?.data?.message ||
            "Payment verification failed. Please contact support if amount was deducted."
        );
      }
    };

    verifyPayment();
  }, [reference, trxref, dispatch]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  // Verifying State
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
            <FiLoader
              className="absolute inset-0 m-auto text-primary-500 animate-pulse"
              size={32}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
              <FiCheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-lg font-bold text-gray-800">
                  #{order?.orderNumber || order?.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-bold gradient-text">
                  {formatPrice(order?.totalAmount || order?.total_amount || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <FiMail size={18} />
                <span>
                  Confirmation sent to{" "}
                  {order?.shippingAddress?.email ||
                    order?.shipping_address?.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <FiShoppingBag size={18} />
                <span>
                  {order?.orderItems?.length || order?.totalItems || 0} item(s)
                  in your order
                </span>
              </div>
            </div>

            {/* Order Status Timeline */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-4">Order Status</h3>
              <div className="flex items-center gap-4">
                {["Confirmed", "Processing", "Shipped", "Delivered"].map(
                  (step, index) => (
                    <div key={step} className="flex-1">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                      <p
                        className={`text-xs mt-1 ${
                          index === 0
                            ? "text-green-600 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li>• You'll receive an email confirmation shortly</li>
              <li>• We'll notify you when your order ships</li>
              <li>• Track your order anytime from your account</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={`/orders/${order?.id}`}
              className="flex-1 py-4 btn-gradient rounded-xl font-semibold text-center flex items-center justify-center gap-2"
            >
              <FiShoppingBag />
              View Order
            </Link>
            <Link
              to="/"
              className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 text-center flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <FiHome />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Failed State
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto text-center">
        {/* Failed Animation */}
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <FiXCircle className="text-red-500" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-8">
          {message || "We couldn't process your payment. Please try again."}
        </p>

        {/* Possible Reasons */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-4">
            Possible Reasons:
          </h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Insufficient funds in your account
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Card declined by your bank
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Network or connection issues
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              Transaction timed out
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/cart"
            className="flex-1 py-4 btn-gradient rounded-xl font-semibold text-center"
          >
            Try Again
          </Link>
          <Link
            to="/"
            className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 text-center hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
        </div>

        {/* Support */}
        <p className="text-sm text-gray-500 mt-8">
          Need help?{" "}
          <a
            href="mailto:support@enamsclothings.com"
            className="text-primary-500 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentVerify;
