"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../redux/slices/cartSlice";
import { getProductImage } from "../../utils/imageUrl";
import { getValidRecentlyViewed } from "../../utils/recentlyViewed";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiArrowLeft,
  FiTag,
  FiCheck,
} from "react-icons/fi";

const Cart = () => {
  const SAVED_COUPON_KEY = "savedCouponCode";
  const CHECKOUT_STATE_KEY = "checkoutState";

  const dispatch = useDispatch();
  const router = useRouter();

  const { items, totalAmount, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [editingQuantity, setEditingQuantity] = useState({});
  const prunedInvalidItemsRef = useRef(new Set());

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Remove stale cart rows whose products were deleted/unpublished.
  useEffect(() => {
    const invalidItems = items.filter((item) => !item.product?.id);
    if (!invalidItems.length) return;

    const pruneInvalidItems = async () => {
      let removedCount = 0;

      for (const invalidItem of invalidItems) {
        if (prunedInvalidItemsRef.current.has(invalidItem.id)) continue;

        prunedInvalidItemsRef.current.add(invalidItem.id);
        try {
          await dispatch(removeFromCart(invalidItem.id)).unwrap();
          removedCount += 1;
        } catch (error) {
          // Allow retry if request fails.
          prunedInvalidItemsRef.current.delete(invalidItem.id);
        }
      }

      if (removedCount > 0) {
        toast.success("Removed unavailable item(s) from cart");
      }
    };

    pruneInvalidItems();
  }, [dispatch, items]);

  // Calculate summary - ensure all values are numbers
  const subtotal = parseFloat(totalAmount) || 0;

  // Auto-validate and sync coupon when cart subtotal changes (or on initial load)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedCoupon = localStorage.getItem(SAVED_COUPON_KEY);
    const codeToValidate = appliedCoupon?.code || savedCoupon;

    if (codeToValidate && subtotal > 0) {
      const validateAutomatically = async () => {
        try {
          const response = await api.post("/coupons/validate", {
            code: codeToValidate,
            subtotal: subtotal,
          });
          if (response.data.success) {
            setAppliedCoupon(response.data.coupon);
            setCouponDiscount(response.data.discount);
            setCouponCode(response.data.coupon.code);
            localStorage.setItem(SAVED_COUPON_KEY, response.data.coupon.code);
          }
        } catch (error) {
          // If the coupon becomes invalid (e.g. minimum spend not met anymore)
          setAppliedCoupon(null);
          setCouponDiscount(0);
          setCouponCode("");
          localStorage.removeItem(SAVED_COUPON_KEY);
        }
      };
      validateAutomatically();
    }
  }, [subtotal, appliedCoupon?.code]);

  // Load recently viewed products
  useEffect(() => {
    let isMounted = true;

    const loadRecentlyViewed = async () => {
      const viewed = await getValidRecentlyViewed();
      // Filter out items that are already in the cart
      const cartProductIds = items.map((item) => item.product?.id);
      const filteredViewed = viewed.filter(
        (p) => !cartProductIds.includes(p.id),
      );
      if (isMounted) {
        setRecentlyViewed(filteredViewed.slice(0, 4));
      }
    };

    loadRecentlyViewed();

    return () => {
      isMounted = false;
    };
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

  const handleDirectQuantityChange = (itemId, value) => {
    // Update local state immediately for responsive UI
    setEditingQuantity((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityBlur = async (itemId, value) => {
    const newQty = parseInt(value) || 1;
    if (newQty < 1) {
      setEditingQuantity((prev) => ({ ...prev, [itemId]: 1 }));
      return;
    }

    try {
      await dispatch(updateCartItem({ itemId, quantity: newQty })).unwrap();
      setEditingQuantity((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    } catch (error) {
      toast.error(error || "Failed to update quantity");
      setEditingQuantity((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
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
    // Preserve coupon state before navigating to checkout.

    if (typeof window !== "undefined") {
      localStorage.setItem(
        CHECKOUT_STATE_KEY,
        JSON.stringify({
          coupon: appliedCoupon,
          couponDiscount: couponDiscount,
        }),
      );
    }
    router.push("/checkout");
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
        localStorage.setItem(SAVED_COUPON_KEY, response.data.coupon.code);
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(SAVED_COUPON_KEY);
      localStorage.removeItem(CHECKOUT_STATE_KEY);
    }
    toast.success("Coupon removed");
  };

  // Calculate summary
  const shippingFee = 0; // Will be calculated at checkout with Yango
  const total = subtotal - couponDiscount + shippingFee;

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 cursor-default">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8 cursor-default">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 btn-gradient rounded-full font-semibold"
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
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-8 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gold-light">
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

        <div className="grid lg:grid-cols-3 gap-8 min-w-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex gap-4 overflow-hidden"
              >
                {/* Product Image */}
                <Link
                  href={
                    item.product?.id ? `/product/${item.product.id}` : "/shop"
                  }
                  className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={getProductImage(item.product)}
                    alt={item.product?.name || "Unavailable product"}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        href={
                          item.product?.id
                            ? `/product/${item.product.id}`
                            : "/shop"
                        }
                        className="font-medium text-gray-800 hover:text-primary-500 line-clamp-2"
                      >
                        {item.product?.name || "Unavailable product"}
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, -1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50"
                        >
                          <FiMinus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={
                            editingQuantity[item.id] !== undefined
                              ? editingQuantity[item.id]
                              : item.quantity
                          }
                          onChange={(e) =>
                            handleDirectQuantityChange(item.id, e.target.value)
                          }
                          onBlur={(e) =>
                            handleQuantityBlur(item.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.target.blur();
                            }
                          }}
                          className="w-10 text-center font-medium border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-white bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity, 1)
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
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
                    <div className="w-full sm:w-auto text-left sm:text-right">
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
              href="/shop"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mt-4"
            >
              <FiArrowLeft />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-6 overflow-hidden">
              <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>

              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiTag className="inline mr-1" />
                  Promo Code
                </label>
                {appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-green-700 font-medium text-sm min-w-0 break-words">
                      <FiCheck className="inline mr-1" />
                      {appliedCoupon.code} applied
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
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                      placeholder="Enter coupon code"
                      className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3 text-gray-600">
                  <span className="flex-1">Subtotal</span>
                  <span className="flex-1 text-right min-w-0 break-words">
                    GH₵{Math.round(subtotal).toLocaleString()}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-start justify-between gap-3 text-green-600">
                    <span className="flex-1 min-w-0 break-words">
                      Discount ({appliedCoupon?.code})
                    </span>
                    <span className="flex-1 text-right min-w-0 break-words">
                      -GH₵{Math.round(couponDiscount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 text-gray-600">
                  <span className="flex-1">Shipping</span>
                  <span className="flex-1 text-right min-w-0 break-words text-green-600">
                    Calculated at checkout
                  </span>
                </div>
                <div className="border-t pt-3 flex items-start justify-between gap-3 font-bold text-gray-900 text-base">
                  <span className="flex-1">Total</span>
                  <span className="flex-1 text-right min-w-0 break-words">
                    GH₵{Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3 btn-gradient rounded-xl font-semibold text-base disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              You Also Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
                          process.env.NEXT_PUBLIC_API_URL ||
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
                    href={`/product/${product.id}`}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
