const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Newsletter = sequelize.define(
  "Newsletter",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    subscribedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    unsubscribedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "newsletters",
  }
);

module.exports = Newsletter;
