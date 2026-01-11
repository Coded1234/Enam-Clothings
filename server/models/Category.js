const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    meta_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "categories",
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: (category) => {
        if (!category.slug) {
          category.slug = category.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        }
      },
      beforeUpdate: (category) => {
        if (category.changed("name") && !category.changed("slug")) {
          category.slug = category.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        }
      },
    },
  }
);

// Self-referencing associations for parent/child categories
Category.hasMany(Category, { as: "subcategories", foreignKey: "parent_id" });
Category.belongsTo(Category, { as: "parent", foreignKey: "parent_id" });

module.exports = Category;
