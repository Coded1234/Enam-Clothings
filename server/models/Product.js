const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Product name is required" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    comparePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM("men", "women"),
      allowNull: false,
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    sizes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    colors: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    totalStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    soldCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    averageRating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remainingStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    tableName: "products",
    underscored: true,
    indexes: [
      { fields: ["category"] },
      { fields: ["featured"] },
      { fields: ["is_active"] },
      { fields: ["price"] },
      { fields: ["sold_count"] },
      { fields: ["average_rating"] },
    ],
  },
);

module.exports = Product;
