import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../utils/api";
import toast from "react-hot-toast";
import AddressMapPicker from "../../components/customer/AddressMapPicker";
import {
  FiMapPin,
  FiCreditCard,
  FiLock,
  FiCheck,
  FiChevronRight,
  FiTruck,
  FiShield,
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
    addressDetails: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [saveAddress, setSaveAddress] = useState(true);

  // Coupon state - initialize with passed data from Cart
  const [couponCode, setCouponCode] = useState(passedCoupon?.code || "");
  const [appliedCoupon, setAppliedCoupon] = useState(passedCoupon);
  const [couponDiscount, setCouponDiscount] = useState(passedDiscount);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Shipping state for Yango integration
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Cost calculation - ensure all values are numbers
  const subtotal = parseFloat(totalAmount) || 0;
  const tax = (subtotal - couponDiscount) * 0.0; // Tax included in prices
  const finalTotal = subtotal - couponDiscount + shippingCost + tax;

  // Auto-enable free shipping for orders >= GH₵1000
  React.useEffect(() => {
    if (subtotal >= 1000) {
      setShippingCost(0);
      setShippingCalculated(true);
      setShippingDetails(
        (prev) =>
          prev || {
            shippingFee: 0,
            carrier: "Free Shipping",
            estimatedDeliveryTime: "Varies",
          },
      );
    }
  }, [subtotal]);

  // Nigerian states
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    // Reset shipping calculation when address changes
    if (e.target.name === "address" || e.target.name === "phone") {
      setShippingCalculated(false);
    }
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
    const required = ["address"];
    for (const field of required) {
      if (!shippingInfo[field]) {
        toast.error(
          `Please enter your ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`,
        );
        return false;
      }
    }
    if (!city) {
      toast.error("Please enter your city");
      return false;
    }
    return true;
  };

  // Handle address selection from map
  const handleAddressSelect = (addressData) => {
    setShippingInfo({
      ...shippingInfo,
      address: addressData.address,
    });
    setCity(addressData.city);
    setSelectedLocation({
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    });
    setShippingCalculated(false);
  };

  // Calculate shipping rate using Yango API
  const calculateShipping = async () => {
    if (!validateShipping()) {
      return;
    }

    // Free shipping override
    if (subtotal >= 1000) {
      setShippingCost(0);
      setShippingDetails({
        shippingFee: 0,
        carrier: "Free Shipping",
        estimatedDeliveryTime: "Varies",
      });
      setShippingCalculated(true);
      toast.success("Free shipping applied for orders over GH₵1,000");
      return;
    }

    setShippingLoading(true);
    try {
      const response = await api.post("/shipping/calculate", {
        address: shippingInfo.address,
        city: city,
        postalCode: postalCode,
        phone: shippingInfo.phone,
      });

      if (response.data.success) {
        setShippingCost(response.data.data.shippingFee);
        setShippingDetails(response.data.data);
        setShippingCalculated(true);
        toast.success(
          `Shipping calculated: GH₵${Math.round(response.data.data.shippingFee)}`,
        );
      }
    } catch (error) {
      console.error("Shipping calculation error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to calculate shipping. Using estimated rate.",
      );
      // Fallback to estimated rate
      setShippingCost(50);
      setShippingDetails({
        shippingFee: 50,
        estimatedDeliveryTime: "2-5 business days",
        carrier: "Standard Delivery",
        fallback: true,
      });
      setShippingCalculated(true);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      if (!shippingCalculated) {
        toast.error("Please calculate shipping cost first");
        return;
      }
      // Navigate directly to order summary page
      navigate("/order-summary", {
        state: {
          orderData: {
            shippingAddress: {
              ...shippingInfo,
              city,
              postalCode,
            },
            couponId: appliedCoupon?.id || null,
            discount: couponDiscount,
            shippingDetails: shippingDetails,
          },
          items: items,
          totalAmount: totalAmount,
          coupon: appliedCoupon,
          couponDiscount: couponDiscount,
          shippingCost: shippingCost,
          shippingDetails: shippingDetails,
        },
      });
    }
  };

  const handlePayment = async () => {
    // Navigate to order summary page for review
    navigate("/order-summary", {
      state: {
        orderData: {
          shippingAddress: {
            ...shippingInfo,
            city,
            postalCode,
          },
          paymentMethod: paymentMethod,
          couponId: appliedCoupon?.id || null,
          discount: couponDiscount,
          shippingDetails: shippingDetails,
        },
        items: items,
        totalAmount: totalAmount,
        coupon: appliedCoupon,
        couponDiscount: couponDiscount,
        shippingCost: shippingCost,
        shippingDetails: shippingDetails,
      },
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gold-light text-center">
            Shipping Information
          </h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Shipping Information */}
          <div className="bg-white dark:bg-surface rounded-2xl shadow-sm p-6 md:p-8">
            <div className="space-y-5">
              {/* Map Address Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FiMapPin className="inline mr-2" />
                  Select Delivery Location on Map *
                </label>
                <AddressMapPicker
                  onAddressSelect={handleAddressSelect}
                  currentPosition={selectedLocation}
                />
              </div>

              {/* Additional Address Details (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Address Details (Optional)
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                  <textarea
                    name="addressDetails"
                    value={shippingInfo.addressDetails}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    placeholder="Apartment, floor, building name, nearest landmark, directions, etc."
                  />
                </div>
              </div>

              {/* City (Auto-filled from map) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShippingCalculated(false);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 text-gray-900 dark:text-white"
                  placeholder="Auto-detected from map"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-filled from map selection
                </p>
              </div>

              {/* Postal Code (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    setShippingCalculated(false);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  placeholder="e.g., GA-123-4567"
                />
              </div>

              {/* Calculate Shipping Button */}
              <div>
                <button
                  type="button"
                  onClick={calculateShipping}
                  disabled={shippingLoading || !shippingInfo.address || !city}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {shippingLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : shippingCalculated ? (
                    <>
                      <FiCheck className="text-white" />
                      Shipping Calculated
                    </>
                  ) : (
                    <>
                      <FiTruck />
                      Calculate Shipping Cost
                    </>
                  )}
                </button>

                {/* Shipping Details Display */}
                {shippingDetails && (
                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 flex items-center gap-2">
                          <FiTruck className="text-green-600" />
                          {shippingDetails.carrier}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {shippingDetails.estimatedDeliveryTime}
                        </p>
                        {shippingDetails.distance && (
                          <p className="text-xs text-green-600 mt-1">
                            Distance: ~{shippingDetails.distance} km
                          </p>
                        )}
                        {shippingDetails.fallback && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠ Using estimated rate
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-800">
                          GH₵{Math.round(shippingDetails.shippingFee)}
                        </p>
                        <p className="text-xs text-green-600">Shipping Fee</p>
                      </div>
                    </div>
                  </div>
                )}
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
              Continue to Order Summary
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
