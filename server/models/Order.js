const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/database");
const crypto = require("crypto");

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
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guestName: {
      type: DataTypes.STRING,
      allowNull: true,
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
    shippingDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment:
        "Stores carrier, service type, estimated delivery, distance, etc.",
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
        "cancelled",
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

    // Returns
    returnRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    returnApprovalStatus: {
      type: DataTypes.ENUM("pending", "approved", "not_approved"),
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["payment_status"] },
      { fields: ["created_at"] },
      { unique: true, fields: ["order_number"] },
      {
        unique: true,
        fields: ["payment_reference"],
        where: { payment_reference: { [Op.ne]: null } },
      },
    ],
    hooks: {
      beforeCreate: (order) => {
        // Generate order number (exactly 7 random alphanumeric characters)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const randomBytes = crypto.randomBytes(7);
        let randomStr = "";
        for (let i = 0; i < 7; i++) {
          randomStr += chars[randomBytes[i] % chars.length];
        }
        order.orderNumber = `DAG-${randomStr}`;

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
  },
);

module.exports = Order;
