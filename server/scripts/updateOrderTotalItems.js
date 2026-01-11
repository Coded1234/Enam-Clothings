require("dotenv").config();
const { Order, OrderItem } = require("../models");
const { sequelize } = require("../config/database");

async function updateOrderTotalItems() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    // Get all orders with their items
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: "items" }],
    });

    console.log(`Found ${orders.length} orders to update`);

    for (const order of orders) {
      const totalItems = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      if (order.totalItems !== totalItems) {
        await order.update({ totalItems });
        console.log(
          `Updated order ${order.orderNumber}: totalItems = ${totalItems}`
        );
      }
    }

    console.log("All orders updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating orders:", error);
    process.exit(1);
  }
}

updateOrderTotalItems();
