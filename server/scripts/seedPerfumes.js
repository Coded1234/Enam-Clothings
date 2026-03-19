const path = require("path");

// Ensure env vars are loaded even when running from the repo root:
//   node server/scripts/seedPerfumes.js
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
});

const { sequelize, Category } = require("../models");

const seedPerfumesCategory = async () => {
  const connectionSummary = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "stylestore",
    user: process.env.DB_USER || "postgres",
    usingDatabaseUrl: Boolean(process.env.DATABASE_URL),
  };

  try {
    console.log("🔌 Connecting to PostgreSQL...", connectionSummary);
    await sequelize.authenticate();

    // Ensure the Product.category enum supports "perfumes".
    // This project uses a Postgres ENUM (enum_products_category) for products.category.
    // Sequelize's sync/alter won't reliably add new enum values, so do it explicitly.
    await sequelize.query(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_category') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_products_category'
        AND e.enumlabel = 'perfumes'
    ) THEN
      ALTER TYPE "enum_products_category" ADD VALUE 'perfumes';
    END IF;
  END IF;
END $$;
    `);

    await sequelize.sync();

    const [category, created] = await Category.findOrCreate({
      where: { slug: "perfumes" },
      defaults: {
        name: "Perfumes",
        slug: "perfumes",
        description: "A collection of exquisite perfumes.",
        is_active: true,
        display_order: 0,
      },
    });

    console.log(
      created
        ? "✅ Created category: Perfumes"
        : "ℹ️ Category already exists: Perfumes",
    );
    return category;
  } catch (error) {
    console.error("❌ Error seeding Perfumes category:", error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
  }
};

seedPerfumesCategory();
