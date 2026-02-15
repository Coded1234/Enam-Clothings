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
    <div className="group bg-white dark:bg-surface rounded-lg shadow-sm overflow-hidden card-hover w-full">
      {/* Image */}
      <div className="relative img-zoom aspect-square">
        <Link to={`/product/${product.id}`}>
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              Featured
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className={`p-1.5 rounded-full shadow-md transition-colors ${
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-surface text-gray-700 dark:text-gold-light hover:bg-red-500 hover:text-white"
            } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <FiHeart size={16} className={isWishlisted ? "fill-current" : ""} />
          </button>
        </div>

        {/* Add to Cart Button - Hidden on compact view */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddToCart}
            disabled={product.remainingStock === 0}
            className={`w-full py-1.5 bg-white dark:bg-surface text-gray-900 dark:text-gold-light rounded text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary-500 hover:text-white transition-colors ${
              product.remainingStock === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <FiShoppingCart size={14} />
            {product.remainingStock === 0 ? "Out of Stock" : "Add"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-gray-800 dark:text-gold-light text-sm mb-1 hover:text-primary-500 transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-base font-bold text-gray-900 dark:text-gold-light">
            GH₵{Math.round(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 dark:text-primary-400 line-through">
              GH₵{Math.round(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.remainingStock <= 10 && product.remainingStock > 0 && (
          <p className="text-xs text-orange-500 mt-1">
            {product.remainingStock} left
          </p>
        )}
        {product.remainingStock === 0 && (
          <p className="text-xs text-red-500 mt-1">Out of stock</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
