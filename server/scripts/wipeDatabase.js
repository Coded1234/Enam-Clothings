/**
 * wipeDatabase.js
 * Drops ALL tables on the Neon (production) database and recreates them empty.
 * Run with:  node scripts/wipeDatabase.js
 */

require("dotenv").config();
const { sequelize } = require("../config/database");

// Import models so Sequelize knows about all tables
require("../models/index");

async function wipeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Neon database");

    console.log("⚠️  Dropping all tables...");
    // force: true drops and recreates; cascade handles FK order automatically
    await sequelize.sync({ force: true });

    console.log("✅ All tables dropped and recreated (empty).");
    console.log("   The database is now completely wiped.");
  } catch (err) {
    console.error("❌ Error wiping database:", err.message);
  } finally {
    await sequelize.close();
  }
}

wipeDatabase();
