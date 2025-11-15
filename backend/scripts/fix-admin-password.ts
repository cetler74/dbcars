import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function fixAdminPassword() {
  try {
    console.log('Connecting to database...');
    
    // Check if admin user exists
    const checkUser = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      ['admin@dbcars.com']
    );

    if (checkUser.rows.length === 0) {
      console.log('Admin user does not exist. Creating...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
        ['admin@dbcars.com', passwordHash, 'Admin User', 'admin']
      );
      console.log('✅ Admin user created successfully!');
      console.log('User:', result.rows[0]);
    } else {
      console.log('Admin user exists. Updating password...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [passwordHash, 'admin@dbcars.com']
      );
      console.log('✅ Admin password updated successfully!');
      console.log('User:', checkUser.rows[0]);
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@dbcars.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPassword();

