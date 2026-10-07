import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'subscriptiontrack',
    user: 'postgres',
    password: '123456'
});

async function applyMigration() {
    try {
        const db = drizzle(pool);
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_add_reset_tokens.sql'), 'utf8');
        
        await pool.query(sql);
        console.log('Migration applied successfully');
    } catch (error) {
        console.error('Error applying migration:', error);
    } finally {
        await pool.end();
    }
}

applyMigration();
