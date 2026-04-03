"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiHeart, FiShoppingCart, FiStar } from "react-icons/fi";
import { getProductImage } from "../../utils/imageUrl";
import { addToCart } from "../../redux/slices/cartSlice";
import { authAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted: externalWishlisted,
  showFullDescription = false,
  className = "",
  imageWrapperClassName = "",
  infoOverlay = false,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isWishlisted, setIsWishlisted] = useState(externalWishlisted || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const displayStock = product?.remainingStock ?? product?.totalStock ?? 0;
  const isOutOfStock = displayStock === 0;

  useEffect(() => {
    // Check if product is in user's wishlist
    if (user?.wishlist && product?.id) {
      setIsWishlisted(user.wishlist.includes(product.id));
    }
  }, [user?.wishlist, product?.id]);

  const discountPercent = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Get first available size from product
      const availableSize =
        product.sizes?.find((s) => s.stock > 0)?.size || "M";

      dispatch(
        addToCart({
          productId: product.id,
          quantity: 1,
          size: availableSize,
        }),
      )
        .unwrap()
        .then(() => {
          toast.success("Added to cart!");
        })
        .catch((error) => {
          toast.error(error || "Failed to add to cart");
        });
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      router.push("/login");
      return;
    }

    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    } else {
      setWishlistLoading(true);
      try {
        await authAPI.toggleWishlist(product.id);
        setIsWishlisted(!isWishlisted);
        toast.success(
          isWishlisted ? "Removed from wishlist" : "Added to wishlist!",
        );
      } catch (error) {
        toast.error("Failed to update wishlist");
      } finally {
        setWishlistLoading(false);
      }
    }
  };

  return (
    <div
      className={`group bg-white dark:bg-surface rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden w-full flex flex-col ${className}`}
    >
      {/* Image */}
      <div
        className={`relative w-full bg-gray-50 overflow-hidden ${
          imageWrapperClassName || "aspect-[4/5]"
        }`}
      >
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={getProductImage(product)}
            alt={product.name}
            width={400}
            height={500}
            loading="lazy"
            className="w-full h-full object-cover dark:mix-blend-normal mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {infoOverlay && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-white text-xs sm:text-sm mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-sm sm:text-base">
                  GH₵{Math.round(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-white/70 text-[10px] sm:text-xs line-through">
                    GH₵{Math.round(product.comparePrice)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-red-600/90 backdrop-blur-sm shadow-sm text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-wide">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="bg-[#D4AF37]/90 backdrop-blur-sm shadow-sm text-white text-[10px] sm:text-[11px] font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-wide">
              Featured
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`p-2 sm:p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all hover:scale-110 ${
              isWishlisted
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-white/90 dark:bg-surface/90 text-gray-700 dark:text-gold-light hover:bg-red-500 hover:text-white"
            } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <FiHeart
              size={16}
              className={`sm:w-[18px] sm:h-[18px] ${isWishlisted ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Add to Cart Button - Hidden on compact view */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 bg-white text-black font-semibold rounded-md shadow flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all ${
              isOutOfStock ? "opacity-50 cursor-not-allowed hidden" : ""
            }`}
          >
            <FiShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      {!infoOverlay && (
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          <Link href={`/product/${product.id}`}>
            <h3 className="text-gray-800 text-[15px] mb-1 hover:text-yellow-600 transition-colors line-clamp-2 md:truncate">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-lg font-bold text-gray-900">
              GH₵{Math.round(product.price)}
            </span>
            {product.comparePrice && (
              <span className="text-sm font-medium text-gray-400 line-through">
                GH₵{Math.round(product.comparePrice)}
              </span>
            )}
          </div>

          <div className="mt-auto">
            {isOutOfStock ? (
              <p className="text-sm font-medium text-red-600">Out of stock</p>
            ) : displayStock <= 10 && displayStock > 0 ? (
              <p className="text-sm font-medium text-orange-500">
                {displayStock} left
              </p>
            ) : (
              <p className="text-sm text-transparent select-none">In stock</p> // Layout spacer
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
