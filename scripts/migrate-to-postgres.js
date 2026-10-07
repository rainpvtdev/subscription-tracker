#!/usr/bin/env node

/**
 * Data Migration Script
 *
 * This script migrates data from in-memory storage to PostgreSQL database.
 * It ensures all data is properly transferred with validation and error handling.
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
import { format } from "date-fns";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STORAGE_PATH = process.env.STORAGE_PATH || "./data";
const BACKUP_PATH = process.env.BACKUP_PATH || "./backup";
const BACKUP_FILES = process.env.BACKUP_FILES !== "false";

// Helper to format dates for PostgreSQL
function formatDate(date) {
    return date ? format(new Date(date), "yyyy-MM-dd HH:mm:ss") : null;
}

// Setup database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Setup directories
async function setupDirectories() {
    // Ensure storage directory exists
    if (!fs.existsSync(STORAGE_PATH)) {
        console.warn(`Storage directory '${STORAGE_PATH}' does not exist, creating it...`);
        await fs.ensureDir(STORAGE_PATH);
    }

    // If backing up, ensure backup directory exists
    if (BACKUP_FILES) {
        await fs.ensureDir(BACKUP_PATH);
    }

    // Check required files
    const requiredFiles = ["users.json", "subscriptions.json"];
    const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(STORAGE_PATH, file)));

    if (missingFiles.length > 0) {
        console.warn(`Warning: Some expected data files are missing: ${missingFiles.join(", ")}`);
        console.warn("Only existing files will be migrated.");
    }
}

// Read data from storage files
async function readStorageFiles() {
    const data = {};

    try {
        // Read users if exists
        const usersPath = path.join(STORAGE_PATH, "users.json");
        if (fs.existsSync(usersPath)) {
            data.users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
            console.log(`Read ${data.users.length} users from storage`);
        } else {
            data.users = [];
            console.log("No users file found, skipping users migration");
        }

        // Read subscriptions if exists
        const subscriptionsPath = path.join(STORAGE_PATH, "subscriptions.json");
        if (fs.existsSync(subscriptionsPath)) {
            data.subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, "utf8"));
            console.log(`Read ${data.subscriptions.length} subscriptions from storage`);
        } else {
            data.subscriptions = [];
            console.log("No subscriptions file found, skipping subscriptions migration");
        }

        return data;
    } catch (error) {
        console.error("Error reading storage files:", error.message);
        throw error;
    }
}

// Migrate users
async function migrateUsers(usersData) {
    if (!usersData || usersData.length === 0) {
        console.log("No users to migrate");
        return;
    }

    console.log(`Migrating ${usersData.length} users to PostgreSQL...`);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let migrated = 0;
        for (const user of usersData) {
            const { rows } = await client.query(
                `INSERT INTO users (id, username, email, password, name, "created_at") 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET username = $2, email = $3, password = $4, name = $5, "created_at" = $6
         RETURNING id`,
                [user.id, user.username, user.email, user.password, user.name, user.created_at ? new Date(user.created_at) : new Date()]
            );

            if (rows.length > 0) {
                migrated++;
            }
        }

        await client.query("COMMIT");
        console.log(`Successfully migrated ${migrated} users to PostgreSQL`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error migrating users:", error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Migrate subscriptions
async function migrateSubscriptions(subscriptionsData) {
    if (!subscriptionsData || subscriptionsData.length === 0) {
        console.log("No subscriptions to migrate");
        return;
    }

    console.log(`Migrating ${subscriptionsData.length} subscriptions to PostgreSQL...`);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let migrated = 0;
        for (const subscription of subscriptionsData) {
            const { rows } = await client.query(
                `INSERT INTO subscriptions (
           id, "user_id", name, category, plan, amount, "billing_cycle", 
           "next_payment_date", status, reminder, notes, "created_at"
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE
         SET "user_id" = $2, name = $3, category = $4, plan = $5, 
             amount = $6, "billing_cycle" = $7, "next_payment_date" = $8,
             status = $9, reminder = $10, notes = $11, "created_at" = $12
         RETURNING id`,
                [
                    subscription.id,
                    subscription.user_id,
                    subscription.name,
                    subscription.category,
                    subscription.plan,
                    subscription.amount,
                    subscription.billing_cycle,
                    subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
                    subscription.status,
                    subscription.reminder,
                    subscription.notes,
                    subscription.created_at ? new Date(subscription.created_at) : new Date(),
                ]
            );

            if (rows.length > 0) {
                migrated++;
            }
        }

        await client.query("COMMIT");
        console.log(`Successfully migrated ${migrated} subscriptions to PostgreSQL`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error migrating subscriptions:", error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Handle processed files (backup or delete)
async function handleProcessedFiles() {
    try {
        if (BACKUP_FILES) {
            // Create timestamp for backup
            const timestamp = format(new Date(), "yyyyMMdd-HHmmss");

            // Backup users.json if exists
            const usersPath = path.join(STORAGE_PATH, "users.json");
            if (fs.existsSync(usersPath)) {
                const backupPath = path.join(BACKUP_PATH, `users-${timestamp}.json`);
                await fs.copy(usersPath, backupPath);
                console.log(`Backed up users.json to ${backupPath}`);
            }

            // Backup subscriptions.json if exists
            const subscriptionsPath = path.join(STORAGE_PATH, "subscriptions.json");
            if (fs.existsSync(subscriptionsPath)) {
                const backupPath = path.join(BACKUP_PATH, `subscriptions-${timestamp}.json`);
                await fs.copy(subscriptionsPath, backupPath);
                console.log(`Backed up subscriptions.json to ${backupPath}`);
            }
        } else {
            // Remove files instead of backing up
            const usersPath = path.join(STORAGE_PATH, "users.json");
            if (fs.existsSync(usersPath)) {
                await fs.remove(usersPath);
                console.log(`Removed users.json`);
            }

            const subscriptionsPath = path.join(STORAGE_PATH, "subscriptions.json");
            if (fs.existsSync(subscriptionsPath)) {
                await fs.remove(subscriptionsPath);
                console.log(`Removed subscriptions.json`);
            }
        }
    } catch (error) {
        console.error("Error handling processed files:", error.message);
        throw error;
    }
}

// Main migration function
async function migrateData() {
    try {
        // Check database connection
        await pool.query("SELECT NOW()");
        console.log("Connected to PostgreSQL database");

        // Setup directories
        await setupDirectories();

        // Read data from storage files
        const data = await readStorageFiles();

        // Migrate users
        await migrateUsers(data.users);

        // Migrate subscriptions
        await migrateSubscriptions(data.subscriptions);

        // Handle processed files (backup or delete)
        await handleProcessedFiles();

        console.log("Migration completed successfully");
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
migrateData();
