import pool from '../src/config/database';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    console.log('Testing admin login...\n');
    
    const email = 'admin@dbcars.com';
    const password = 'admin123';
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database!');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Password hash (first 30 chars):', user.password_hash.substring(0, 30) + '...');
    console.log('');

    // Test password comparison
    console.log('Testing password comparison...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Password is VALID! Login should work.');
    } else {
      console.log('❌ Password is INVALID!');
      console.log('Regenerating password hash...');
      
      const newHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [newHash, email]
      );
      
      console.log('✅ Password hash updated!');
      console.log('New hash (first 30 chars):', newHash.substring(0, 30) + '...');
      
      // Test again
      const isValidAfterUpdate = await bcrypt.compare(password, newHash);
      if (isValidAfterUpdate) {
        console.log('✅ Password verification works after update!');
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

testLogin();

