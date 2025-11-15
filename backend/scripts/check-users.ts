import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');
    
    // Get all users
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    console.log(`Found ${result.rows.length} user(s):\n`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    // Test login for tiagocordeiro@uptnable.com
    const testEmail = 'tiagocordeiro@uptnable.com';
    const testPassword = 'Test123';
    
    console.log(`\nTesting login for: ${testEmail}`);
    const userResult = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found! Creating now...');
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const newUser = await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [testEmail, passwordHash, 'Tiago Cordeiro', 'admin']
      );
      console.log('✅ User created:', newUser.rows[0]);
    } else {
      const user = userResult.rows[0];
      console.log('✅ User found:', { email: user.email, name: user.name, role: user.role });
      
      // Test password
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      if (isValid) {
        console.log('✅ Password is VALID!');
      } else {
        console.log('❌ Password is INVALID! Updating password...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [newHash, testEmail]
        );
        console.log('✅ Password updated!');
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();

