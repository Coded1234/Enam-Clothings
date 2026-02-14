import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../redux/slices/cartSlice";
import { getProductImage } from "../../utils/imageUrl";
import { getRecentlyViewed } from "../../utils/recentlyViewed";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiArrowLeft,
  FiTag,
  FiTruck,
  FiShield,
  FiX,
  FiEye,
} from "react-icons/fi";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalAmount, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  // Load recently viewed products
  useEffect(() => {
    const viewed = getRecentlyViewed();
    // Filter out items that are already in the cart
    const cartProductIds = items.map((item) => item.product?.id);
    const filteredViewed = viewed.filter((p) => !cartProductIds.includes(p.id));
    setRecentlyViewed(filteredViewed.slice(0, 4));
  }, [items]);

  const handleQuantityChange = async (itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      await dispatch(updateCartItem({ itemId, quantity: newQty })).unwrap();
    } catch (error) {
      toast.error(error || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error(error || "Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await dispatch(clearCart()).unwrap();
        toast.success("Cart cleared");
      } catch (error) {
        toast.error(error || "Failed to clear cart");
      }
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please login to checkout");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    // Pass coupon data to checkout
    navigate("/checkout", {
      state: {
        coupon: appliedCoupon,
        couponDiscount: couponDiscount,
      },
    });
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
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

  // Calculate summary - ensure all values are numbers
  const subtotal = parseFloat(totalAmount) || 0;
  const shippingFee = 0; // Will be calculated at checkout with Yango
  const total = subtotal - couponDiscount + shippingFee;

  // Empty cart state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Please login to view your cart and start shopping!
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 btn-gradient rounded-full font-semibold"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 btn-gradient rounded-full font-semibold"
            >
              <FiShoppingBag />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Shopping Cart
            </h1>
            <p className="text-gray-600 mt-1">
              {items.length} item(s) in your cart
            </p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-red-500 hover:text-red-600 font-medium flex items-center gap-2"
          >
            <FiTrash2 />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex gap-4"
              >
                {/* Product Image */}
                <Link
                  to={`/product/${item.product?.id}`}
                  className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        to={`/product/${item.product?.id}`}
                        className="font-medium text-gray-800 hover:text-primary-500 line-clamp-2"
                      >
                        {item.product?.name}
                      </Link>
                      <div className="mt-1 text-sm text-gray-500 space-y-1">
                        <p>
                          Size:{" "}
                          <span className="text-gray-700">{item.size}</span>
                        </p>
                        {item.color && (
                          <p className="flex items-center gap-2">
                            Color:
                            <span
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: item.color.code }}
                            />
                            <span className="text-gray-700">
                              {item.color.name}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove Button - Desktop */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="hidden md:block text-gray-400 hover:text-red-500 p-2 h-fit"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>

                  {/* Price & Quantity */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, -1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-10 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>

                      {/* Remove Button - Mobile */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="md:hidden text-gray-400 hover:text-red-500 p-2"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        GH₵
                        {Math.round(
                          item.price * item.quantity,
                        ).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500">
                          GH₵{Math.round(item.price).toLocaleString()} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mt-4"
            >
              <FiArrowLeft />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Order Summary
              </h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-green-600">
                        -GH₵{couponDiscount.toLocaleString()} discount
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
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          placeholder="Enter code"
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-1">{couponError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-4 pb-6 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>GH₵{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-GH₵{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-sm text-gray-500">
                    {subtotal >= 1000 ? (
                      <span className="text-green-600 font-medium">
                        Free for orders ≥ GH₵1,000
                      </span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="py-6 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    GH₵{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full mt-6 py-4 btn-gradient rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                Proceed to Checkout
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center gap-6 text-gray-500">
                  <div className="flex items-center gap-2">
                    <FiShield className="text-green-500" />
                    <span className="text-sm">Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiTruck className="text-green-500" />
                    <span className="text-sm">Fast Delivery</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-3">We accept</p>
                <div className="flex justify-center gap-4">
                  <div className="px-3 py-2 rounded text-sm font-medium text-gray-700">
                    MTN Mobile Money
                  </div>
                  <div className="px-3 py-2 rounded text-sm font-medium text-gray-700">
                    ATMoney
                  </div>
                  <div className="px-3 py-2 rounded text-sm font-medium text-gray-700">
                    Telecel Cash
                  </div>
                  <div className="px-3 py-2 rounded text-sm font-medium text-gray-700">
                    Bank Transfers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            You Also Viewed
          </h2>
          {recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentlyViewed.map((product) => {
                const images = Array.isArray(product.images)
                  ? product.images
                  : [];

                // Get image URL safely
                let imageUrl = "/placeholder.jpg";
                if (images.length > 0) {
                  const firstImage = images[0];
                  // Handle both string and object formats
                  const imageStr =
                    typeof firstImage === "string"
                      ? firstImage
                      : firstImage?.url || "";

                  if (imageStr) {
                    imageUrl = imageStr.startsWith("http")
                      ? imageStr
                      : `${
                          process.env.REACT_APP_API_URL ||
                          "http://localhost:5000"
                        }${imageStr}`;
                  }
                }

                const price = parseFloat(product.price) || 0;
                const salePrice = parseFloat(product.salePrice) || 0;
                const hasDiscount = salePrice > 0 && salePrice < price;

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-primary-600">
                              GH₵{salePrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              GH₵{price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-gray-800">
                            GH₵{price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 text-center">
              <FiEye className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                You haven't viewed any products yet. Start browsing to see your
                recently viewed items here!
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-semibold text-gray-800 hover:shadow-md transition-shadow"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
