#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script creates the database tables using the drizzle-kit.
 * It should be run before the migration script to ensure tables exist.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.error('Please set up your PostgreSQL database and configure the connection URL');
  process.exit(1);
}

// Ensure drizzle config exists
const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
if (!fs.existsSync(drizzleConfigPath)) {
  console.error('Error: drizzle.config.ts not found');
  process.exit(1);
}

console.log('Setting up database tables...');

try {
  // Create a simple script to run npm run db:push
  console.log('Running npm run db:push to create database tables...');
  execSync('npm run db:push', { stdio: 'inherit' });

  // Apply additional SQL migrations
  const migrations = [
    'migrations/001_add_reset_tokens.sql',
    'migrations/002_create_session_table.sql',
    'migrations/003_add_deactivated_to_users.sql',
    'migrations/004_add_currency_and_notification_preferences_to_users.sql'
  ];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in the environment');
  }

  // Parse database connection details from DATABASE_URL
  const url = new URL(dbUrl);
  const user = url.username;
  const password = url.password;
  const host = url.hostname;
  const port = url.port || '5432';
  const dbname = url.pathname.replace(/^\//, '');

  migrations.forEach(migration => {
    console.log(`Applying migration: ${migration}`);
    try {
      execSync(`PGPASSWORD=${password} psql -U ${user} -h ${host} -p ${port} -d ${dbname} -f ${migration}`, { stdio: 'inherit' });
      console.log(`Migration ${migration} applied successfully.`);
    } catch (err) {
      console.error(`Error applying migration ${migration}:`, err.message);
      process.exit(1);
    }
  });

  console.log('\nDatabase setup completed successfully');
  
  console.log('\nNext steps:');
  console.log('1. Run the migration script to import data:');
  console.log('   node scripts/migrate-to-postgres.js');
  
} catch (error) {
  console.error('\nError setting up database:', error.message);
  process.exit(1);
}

// Exit with success
process.exit(0);