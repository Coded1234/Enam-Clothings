const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const runMigration = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Read the SQL file
    const sqlPath = path.join(__dirname, "addEmailVerification.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the migration
    console.log("Running email verification migration...");
    await client.query(sql);

    console.log("✅ Email verification fields added successfully!");
    console.log(
      "Note: Existing users have been automatically verified. New users will need to verify their email."
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runMigration();
