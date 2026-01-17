require("dotenv").config();
const { Sequelize } = require("sequelize");

// Connect to production database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});

async function runCompleteMigration() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to production database");

    // 1. Add ai_message column to coupons
    console.log("\n📝 Adding ai_message column to coupons...");
    await sequelize.query(`
      ALTER TABLE coupons 
      ADD COLUMN IF NOT EXISTS ai_message TEXT;
    `);
    console.log("✅ ai_message column added");

    // 2. Add shipping_details to orders
    console.log("\n📝 Adding shipping_details column to orders...");
    await sequelize.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS shipping_details JSONB;
    `);
    console.log("✅ shipping_details column added");

    // 3. Ensure discount column exists in orders
    console.log("\n📝 Ensuring discount column in orders...");
    await sequelize.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
    `);
    console.log("✅ discount column ensured");

    // 4. Ensure total_items column exists in orders
    console.log("\n📝 Ensuring total_items column in orders...");
    await sequelize.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0;
    `);
    console.log("✅ total_items column ensured");

    // 5. Ensure remaining_stock column exists in products
    console.log("\n📝 Ensuring remaining_stock column in products...");
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS remaining_stock INTEGER DEFAULT 0;
    `);
    console.log("✅ remaining_stock column ensured");

    // 6. Update remaining_stock for existing products
    console.log("\n📝 Updating remaining_stock values...");
    await sequelize.query(`
      UPDATE products 
      SET remaining_stock = total_stock - sold_count
      WHERE remaining_stock = 0 OR remaining_stock IS NULL;
    `);
    console.log("✅ remaining_stock values updated");

    // Verify columns
    console.log("\n📋 Verifying columns...");
    const [results] = await sequelize.query(`
      SELECT 
          table_name, 
          column_name, 
          data_type, 
          is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('coupons', 'orders', 'products')
          AND column_name IN ('ai_message', 'shipping_details', 'discount', 'total_items', 'remaining_stock')
      ORDER BY table_name, column_name;
    `);

    console.log("\n✅ Migration complete! Columns found:");
    console.table(results);

    await sequelize.close();
    console.log("\n🎉 All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runCompleteMigration();
