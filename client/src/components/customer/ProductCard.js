import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isWishlisted, setIsWishlisted] = useState(externalWishlisted || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

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
      navigate("/login");
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
    <div className="group bg-white dark:bg-surface rounded-xl shadow-sm overflow-hidden card-hover">
      {/* Image */}
      <div className="relative img-zoom aspect-[4/5]">
        <Link to={`/product/${product.id}`}>
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`p-2 rounded-full shadow-md transition-colors ${
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-surface text-gray-700 dark:text-gray-200 hover:bg-red-500 hover:text-white"
            } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <FiHeart size={18} className={isWishlisted ? "fill-current" : ""} />
          </button>
        </div>

        {/* Add to Cart Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddToCart}
            disabled={product.remainingStock === 0}
            className={`w-full py-2 bg-white dark:bg-surface text-gray-900 dark:text-gray-100 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-500 hover:text-white transition-colors ${
              product.remainingStock === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <FiShoppingCart size={18} />
            {product.remainingStock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 hover:text-primary-500 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description - Desktop Only */}
          {product.description && (
            <p
              className={`hidden lg:block text-sm text-gray-600 dark:text-gray-300 mb-2 ${showFullDescription ? "" : "overflow-hidden text-ellipsis whitespace-nowrap"}`}
            >
              {product.description}
            </p>
          )}
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            GH₵{Math.round(product.price)?.toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
              GH₵{Math.round(product.comparePrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock Status - Desktop Only */}
        {product.remainingStock <= 10 && product.remainingStock > 0 && (
          <p className="hidden lg:block text-xs text-orange-500 mt-2">
            Only {product.remainingStock} left in stock
          </p>
        )}
        {product.remainingStock === 0 && (
          <p className="text-xs text-red-500 mt-2">Out of stock</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
