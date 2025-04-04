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