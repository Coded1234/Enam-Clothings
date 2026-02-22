/**
 * Run this once to add WebAuthn columns to the production database.
 * Usage:  node scripts/runWebAuthnMigration.js
 * Make sure DATABASE_URL is set in your .env (or environment).
 */
require("dotenv").config();
const { sequelize } = require("../config/database");

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    await sequelize.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS webauthn_credentials JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS webauthn_challenge    VARCHAR(255);
    `);

    console.log(
      "✅ Migration complete: webauthn_credentials and webauthn_challenge columns added.",
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

migrate();
