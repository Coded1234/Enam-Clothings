const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    helpful: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "reviews",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
      },
    ],
  }
);

// Static method to calculate average rating
Review.calculateAverageRating = async function (productId) {
  try {
    const result = await Review.findAll({
      where: { productId, isApproved: true },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
      ],
      raw: true,
    });

    const Product = require("./Product");
    if (result.length > 0 && result[0].reviewCount > 0) {
      await Product.update(
        {
          averageRating:
            Math.round(parseFloat(result[0].averageRating) * 10) / 10,
          reviewCount: parseInt(result[0].reviewCount),
        },
        { where: { id: productId } }
      );
    } else {
      await Product.update(
        { averageRating: 0, reviewCount: 0 },
        { where: { id: productId } }
      );
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
};

// Hooks to update product rating
Review.afterCreate(async (review) => {
  await Review.calculateAverageRating(review.productId);
});

Review.afterUpdate(async (review) => {
  await Review.calculateAverageRating(review.productId);
});

Review.afterDestroy(async (review) => {
  await Review.calculateAverageRating(review.productId);
});

module.exports = Review;
