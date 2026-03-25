// Explicit static requires so Vercel's file tracer includes these in the lambda bundle.
// Sequelize loads pg dynamically (require(dialectName)) which the tracer cannot detect.
require("pg");
require("pg-hstore");

const { Sequelize } = require("sequelize");

const applyCompatibilityMigrations = async (sequelize) => {
  const migrations = [
    // Guest cart compatibility
    "ALTER TABLE carts ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);",
    "ALTER TABLE carts ALTER COLUMN user_id DROP NOT NULL;",

    // Guest order compatibility
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255);",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_details JSONB;",
    "ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;",
  ];

  for (const sql of migrations) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      // Non-fatal: keep startup resilient if a statement is unsupported in a managed DB.
      console.warn(`Schema compatibility step skipped: ${err.message}`);
    }
  }
};

// Support both DATABASE_URL (for Vercel/Neon) and individual credentials
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        keepAlive: true,
      },
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 0,
        evict: 1000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || "stylestore",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "password",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        dialectOptions: {
          keepAlive: true,
        },
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 0,
          evict: 1000,
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      },
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected successfully");

    if (process.env.NODE_ENV === "development") {
      // In dev, alter schema to match models
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized (alter)");
    } else {
      // In production, only create tables that don't exist yet (safe, never drops/alters)
      // If you need to add new columns based on model changes, run once with DB_SYNC_ALTER=true.
      const allowAlter =
        String(process.env.DB_SYNC_ALTER || "").toLowerCase() === "true";
      if (allowAlter) {
        await sequelize.sync({ alter: true });
        console.log("✅ Database synchronized (alter) [DB_SYNC_ALTER=true]");
      } else {
        await sequelize.sync({ force: false });
        console.log("✅ Database synchronized (create-if-not-exists)");
      }
    }

    await applyCompatibilityMigrations(sequelize);
    console.log("✅ Database compatibility checks completed");
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
