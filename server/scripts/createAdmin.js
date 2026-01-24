require("dotenv").config();
const { sequelize, User } = require("../models");

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    const adminEmail = "enamclothings@gmail.com";
    const adminPassword = "Admin@1234";
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
    console.log(`Password: ${adminPassword}`);
    console.log("================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();

