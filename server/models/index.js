const { sequelize } = require("../config/database");
const User = require("./User");
const Product = require("./Product");
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Review = require("./Review");
const Wishlist = require("./Wishlist");
const ReviewHelpful = require("./ReviewHelpful");
const Newsletter = require("./Newsletter");
const Settings = require("./Settings");
const ContactMessage = require("./ContactMessage");
const Coupon = require("./Coupon");
const CouponUsage = require("./CouponUsage");
const Category = require("./Category");

// User - Cart (One-to-One)
User.hasOne(Cart, { foreignKey: "userId", as: "cart" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

// Cart - CartItem (One-to-Many)
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId" });

// Product - CartItem (One-to-Many)
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User - Order (One-to-Many)
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Order - OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// Product - OrderItem (One-to-Many)
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User - Review (One-to-Many)
User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });

// Product - Review (One-to-Many)
Product.hasMany(Review, { foreignKey: "productId", as: "reviews" });
Review.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User - Wishlist (One-to-Many)
User.hasMany(Wishlist, { foreignKey: "userId", as: "wishlists" });
Wishlist.belongsTo(User, { foreignKey: "userId", as: "user" });

// Product - Wishlist (One-to-Many)
Product.hasMany(Wishlist, { foreignKey: "productId", as: "wishlistItems" });
Wishlist.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Review - ReviewHelpful (One-to-Many)
Review.hasMany(ReviewHelpful, { foreignKey: "reviewId", as: "helpfulVotes" });
ReviewHelpful.belongsTo(Review, { foreignKey: "reviewId", as: "review" });

// User - ReviewHelpful (One-to-Many)
User.hasMany(ReviewHelpful, { foreignKey: "userId", as: "helpfulVotes" });
ReviewHelpful.belongsTo(User, { foreignKey: "userId", as: "user" });

// Coupon - CouponUsage (One-to-Many)
Coupon.hasMany(CouponUsage, { foreignKey: "coupon_id", as: "usages" });
CouponUsage.belongsTo(Coupon, { foreignKey: "coupon_id", as: "coupon" });

// User - CouponUsage (One-to-Many)
User.hasMany(CouponUsage, { foreignKey: "user_id", as: "couponUsages" });
CouponUsage.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order - CouponUsage (One-to-One)
Order.hasOne(CouponUsage, { foreignKey: "order_id", as: "couponUsage" });
CouponUsage.belongsTo(Order, { foreignKey: "order_id", as: "order" });

module.exports = {
  sequelize,
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review,
  Wishlist,
  ReviewHelpful,
  Newsletter,
  Settings,
  ContactMessage,
  Coupon,
  CouponUsage,
  Category,
};
