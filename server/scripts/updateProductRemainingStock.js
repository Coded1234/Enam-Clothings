require("dotenv").config();
const { Product } = require("../models");
const { sequelize } = require("../config/database");

async function updateProductRemainingStock() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database");

    // Get all products
    const products = await Product.findAll();

    console.log(`Found ${products.length} products to update`);

    for (const product of products) {
      const calculatedRemaining =
        (product.totalStock || 0) - (product.soldCount || 0);

      if (product.remainingStock !== calculatedRemaining) {
        product.remainingStock = calculatedRemaining;
        await product.save();
        console.log(
          `Updated ${product.name}: totalStock=${product.totalStock}, soldCount=${product.soldCount}, remainingStock=${calculatedRemaining}`
        );
      }
    }

    console.log("All products updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating products:", error);
    process.exit(1);
  }
}

updateProductRemainingStock();
