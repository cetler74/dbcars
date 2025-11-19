/**
 * Apply Invoice Migration
 * 
 * This script applies the invoice migration to create the invoices table
 * and invoice number generation function.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dbcars_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function applyMigration() {
  console.log('🔧 Applying Invoice Migration...\n');
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
    const migrationPath = path.join(__dirname, '../../database/migrations', '008_create_invoices_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Apply migration
    console.log('⚙️  Executing migration...');
    await pool.query(sql);
    console.log('✅ Migration executed successfully\n');

    // Verify invoice table exists
    console.log('🔍 Verifying database schema...\n');
    
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'invoices'
      ) as exists`
    );
    
    const tableExists = rows[0].exists;
    const status = tableExists ? '✅' : '❌';
    console.log(`  ${status} Table 'invoices': ${tableExists ? 'EXISTS' : 'MISSING'}`);

    // Check for invoice number function
    const { rows: funcRows } = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'generate_invoice_number'
      ) as exists`
    );
    
    const funcExists = funcRows[0].exists;
    const funcStatus = funcExists ? '✅' : '❌';
    console.log(`  ${funcStatus} Function 'generate_invoice_number': ${funcExists ? 'EXISTS' : 'MISSING'}`);

    if (tableExists && funcExists) {
      console.log('\n✨ Migration completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('  1. Restart your backend server if it\'s running');
      console.log('  2. Test invoice generation by confirming a booking');
      console.log('  3. Check the admin panel to view/download invoices');
      console.log('\n');
    } else {
      console.log('\n⚠️  Migration may not have completed fully. Please check the errors above.');
    }

  } catch (error: any) {
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
    console.error('  4. Check if the database exists');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();

