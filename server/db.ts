import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create the database pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create the Drizzle database instance
export const db = drizzle(pool, { schema });
