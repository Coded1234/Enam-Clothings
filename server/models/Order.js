const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      defaultValue: "paystack",
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      defaultValue: "pending",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
      ),
      defaultValue: "pending",
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalItems: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "orders",
    hooks: {
      beforeCreate: (order) => {
        // Generate order number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        order.orderNumber = `ORD-${timestamp}-${random}`;

        // Initialize status history
        order.statusHistory = [
          {
            status: order.status,
            date: new Date().toISOString(),
          },
        ];
      },
      beforeUpdate: (order) => {
        if (order.changed("status")) {
          const history = order.statusHistory || [];
          history.push({
            status: order.status,
            date: new Date().toISOString(),
          });
          order.statusHistory = history;
        }
      },
    },
  }
);

module.exports = Order;
