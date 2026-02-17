const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Product } = require("../models");

async function checkStock() {
  try {
    console.log("\n=== Checking All Products with Stock Info ===\n");

    // Find all products with their stock
    const products = await Product.findAll({
      attributes: [
        "id",
        "name",
        "price",
        "totalStock",
        "remainingStock",
        "soldCount",
        "category",
      ],
      order: [["name", "ASC"]],
    });

    if (products.length === 0) {
      console.log("No products found");
      return;
    }

    console.log(`Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: GHS${product.price}`);
      console.log(
        `   Total: ${product.totalStock || 0} | Remaining: ${product.remainingStock || 0} | Sold: ${product.soldCount || 0}`,
      );
      console.log("");
    });

    console.log("=== Check Complete ===\n");

    process.exit(0);
  } catch (error) {
    console.error("Error checking stock:", error);
    process.exit(1);
  }
}

checkStock();
