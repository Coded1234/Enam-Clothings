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
      },
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
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
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
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
      await sequelize.sync({ force: false });
      console.log("✅ Database synchronized (create-if-not-exists)");
    }
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
