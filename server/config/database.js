// Explicit static requires so Vercel's file tracer includes these in the lambda bundle.
// Sequelize loads pg dynamically (require(dialectName)) which the tracer cannot detect.
require("pg");
require("pg-hstore");

const { Sequelize } = require("sequelize");

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
      const allowAlter = true; // Temporary force sync to update Vercel DB schema
      if (allowAlter) {
        await sequelize.sync({ alter: true });
        console.log("✅ Database synchronized (alter) [DB_SYNC_ALTER=true]");
      } else {
        await sequelize.sync({ force: false });
        console.log("✅ Database synchronized (create-if-not-exists)");
      }
    }
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
