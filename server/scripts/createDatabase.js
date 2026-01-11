/**
 * Database Setup Script
 * Run this script to create the PostgreSQL database if it doesn't exist
 * Usage: node scripts/createDatabase.js
 */

const { Client } = require("pg");
require("dotenv").config();

const createDatabase = async () => {
  // Connect to PostgreSQL server (default postgres database)
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: "postgres", // Connect to default database first
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL server");

    const dbName = process.env.DB_NAME || "stylestore";

    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      // Create database if it doesn't exist
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully!`);
    } else {
      console.log(`ℹ️ Database '${dbName}' already exists.`);
    }

    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file with your PostgreSQL password");
    console.log("2. Run: npm run dev (to start the server and create tables)");
    console.log("3. Open Beekeeper Studio and connect with these settings:");
    console.log(`   - Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   - Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   - Database: ${dbName}`);
    console.log(`   - User: ${process.env.DB_USER || "postgres"}`);
    console.log("   - Password: Your PostgreSQL password");
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n🔧 PostgreSQL is not running. Please:");
      console.log("1. Make sure PostgreSQL is installed");
      console.log("2. Start PostgreSQL service");
      console.log(
        '   - Windows: Search for "Services", find "postgresql", and Start it'
      );
      console.log(
        "   - Or run: net start postgresql-x64-16 (adjust version number)"
      );
    } else if (error.code === "28P01") {
      console.log("\n🔑 Authentication failed. Please:");
      console.log("1. Update DB_PASSWORD in your .env file");
      console.log("2. Use the password you set during PostgreSQL installation");
    }
  } finally {
    await client.end();
  }
};

createDatabase();
