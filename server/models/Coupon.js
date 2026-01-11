const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue("code", value.toUpperCase());
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    discount_type: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
      defaultValue: "percentage",
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    min_purchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    max_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Maximum discount amount for percentage coupons",
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Total number of times this coupon can be used",
    },
    used_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    usage_limit_per_user: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "Number of times a single user can use this coupon",
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    applicable_categories: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment:
        "Array of category names this coupon applies to. Empty means all categories.",
    },
  },
  {
    tableName: "coupons",
    underscored: true,
    timestamps: true,
  }
);

// Instance method to check if coupon is valid
Coupon.prototype.isValid = function () {
  const now = new Date();

  // Check if active
  if (!this.is_active)
    return { valid: false, message: "This coupon is no longer active" };

  // Check usage limit
  if (this.usage_limit && this.used_count >= this.usage_limit) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }

  // Check dates
  if (this.start_date && new Date(this.start_date) > now) {
    return { valid: false, message: "This coupon is not yet active" };
  }

  if (this.end_date && new Date(this.end_date) < now) {
    return { valid: false, message: "This coupon has expired" };
  }

  return { valid: true };
};

// Instance method to calculate discount
Coupon.prototype.calculateDiscount = function (subtotal) {
  // Check minimum purchase
  if (this.min_purchase && subtotal < parseFloat(this.min_purchase)) {
    return {
      valid: false,
      message: `Minimum purchase of GH₵${this.min_purchase} required`,
      discount: 0,
    };
  }

  let discount = 0;

  if (this.discount_type === "percentage") {
    discount = (subtotal * parseFloat(this.discount_value)) / 100;
    // Apply max discount cap if set
    if (this.max_discount && discount > parseFloat(this.max_discount)) {
      discount = parseFloat(this.max_discount);
    }
  } else {
    discount = parseFloat(this.discount_value);
  }

  // Ensure discount doesn't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return { valid: true, discount: Math.round(discount * 100) / 100 };
};

module.exports = Coupon;
