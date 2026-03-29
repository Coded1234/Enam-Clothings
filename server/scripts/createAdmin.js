require("dotenv").config();
const { sequelize, User } = require("../models");

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    const adminEmail =
      process.env.ADMIN_EMAIL || "diamondauragallery@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD environment variable is required");
    }

    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters long");
    }

    const adminData = {
      firstName: "Admin",
      lastName: "User",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    };

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });

    if (existingUser) {
      // Update existing user to admin
      existingUser.role = "admin";
      existingUser.password = adminPassword; // Hook will hash this
      existingUser.isActive = true;
      existingUser.emailVerified = true;
      await existingUser.save();
      console.log("\n✅ Existing user updated to Admin successfully!");
    } else {
      // Create new admin
      await User.create(adminData);
      console.log("\n✅ New Admin user created successfully!");
    }

    console.log("================================");
    console.log(`Email: ${adminEmail}`);
    console.log("Password: [REDACTED]");
    console.log("================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
