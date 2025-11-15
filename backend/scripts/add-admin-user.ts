import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function addAdminUser() {
  try {
    console.log('Adding admin user...\n');
    
    const email = 'tiagocordeiro@uptnable.com';
    const password = 'Test123';
    const name = 'Tiago Cordeiro';
    
    // Check if user already exists
    const checkUser = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (checkUser.rows.length > 0) {
      console.log('User already exists. Updating password...');
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1, name = $2, role = $3 WHERE email = $4',
        [passwordHash, name, 'admin', email]
      );
      console.log('✅ Admin user password updated successfully!');
      console.log('User:', checkUser.rows[0]);
    } else {
      console.log('Creating new admin user...');
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, passwordHash, name, 'admin']
      );
      console.log('✅ Admin user created successfully!');
      console.log('User:', result.rows[0]);
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addAdminUser();

