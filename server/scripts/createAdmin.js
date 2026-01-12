const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('Admin@123', 10);
    
    // Delete existing admin if exists
    await sequelize.query(
      'DELETE FROM users WHERE email = $1',
      { bind: ['admin@enamclothings.com'] }
    );
    
    // Create new admin
    await sequelize.query(
      `INSERT INTO users (id, first_name, last_name, email, password, role, is_active, created_at, updated_at) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      { bind: ['Admin', 'User', 'admin@enamclothings.com', hash, 'admin', true] }
    );
    
    console.log('\n✅ Admin created successfully!');
    console.log('================================');
    console.log('Email: admin@enamclothings.com');
    console.log('Password: Admin@123');
    console.log('================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
