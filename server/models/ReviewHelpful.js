const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ReviewHelpful = sequelize.define(
  "ReviewHelpful",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reviewId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "review_helpfuls",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["review_id", "user_id"],
      },
    ],
  }
);

module.exports = ReviewHelpful;
