#!/usr/bin/env node

/**
 * Apply Statistics Fix Migration
 * 
 * This script applies the comprehensive migration to fix the Statistics & Reports page
 * by adding all missing tables and columns required for statistics functionality.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dbcars_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function applyMigration() {
  console.log('🔧 Applying Statistics Fix Migration...\n');
  console.log('Database Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'dbcars_db'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log('');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database successfully\n');

    // Read migration file
    console.log('📄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'apply_all_statistics_fixes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Apply migration
    console.log('⚙️  Executing migration...');
    const result = await pool.query(sql);
    console.log('✅ Migration executed successfully\n');

    // Verify tables exist
    console.log('🔍 Verifying database schema...\n');

    const tablesToCheck = ['blog_posts', 'vehicle_extras'];
    for (const table of tablesToCheck) {
      const { rows } = await pool.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = $1
        ) as exists`,
        [table]
      );
      const status = rows[0].exists ? '✅' : '❌';
      console.log(`  ${status} Table '${table}': ${rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    }

    const columnsToCheck = [
      { table: 'bookings', column: 'payment_link' },
      { table: 'customers', column: 'is_blacklisted' },
      { table: 'customers', column: 'blacklist_reason' },
      { table: 'vehicles', column: 'color' },
      { table: 'extras', column: 'cover_image' },
    ];

    console.log('');
    for (const { table, column } of columnsToCheck) {
      const { rows } = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        ) as exists`,
        [table, column]
      );
      const status = rows[0].exists ? '✅' : '❌';
      console.log(`  ${status} Column '${table}.${column}': ${rows[0].exists ? 'EXISTS' : 'MISSING'}`);
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Restart your backend server:');
    console.log('     cd backend && npm run build && npm start');
    console.log('  2. Clear browser cache and reload admin panel');
    console.log('  3. Navigate to Admin > Statistics & Reports');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check your database credentials in backend/.env');
    console.error('  2. Ensure PostgreSQL is running');
    console.error('  3. Verify you have permission to modify the database');
    console.error('  4. Check if the dbcars_db database exists');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();

