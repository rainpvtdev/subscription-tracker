#!/usr/bin/env node

/**
 * Sample Data Generator
 *
 * This script generates sample data files for testing the migration process.
 * It creates users.json and subscriptions.json in the data directory.
 */

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const STORAGE_PATH = process.env.STORAGE_PATH || "./data";

// Ensure storage directory exists
fs.ensureDirSync(STORAGE_PATH);

// Generate a simple hash for passwords (for demo purposes only)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${hash}.${salt}`;
}

// Generate sample users
const users = [
    {
        id: 1,
        username: "user1",
        email: "user1@example.com",
        password: hashPassword("password123"),
        name: "John Doe",
        created_at: new Date("2023-01-01").toISOString(),
    },
    {
        id: 2,
        username: "user2",
        email: "user2@example.com",
        password: hashPassword("password456"),
        name: "Jane Smith",
        created_at: new Date("2023-02-15").toISOString(),
    },
];

// Generate sample subscriptions
const subscriptions = [
    {
        id: 1,
        user_id: 1,
        name: "Netflix",
        category: "Entertainment",
        plan: "Standard",
        amount: "14.99",
        billing_cycle: "Monthly",
        next_payment_date: new Date("2023-05-15").toISOString(),
        status: "active",
        reminder: "3 days before",
        notes: "Shared with family",
        created_at: new Date("2023-01-05").toISOString(),
    },
    {
        id: 2,
        user_id: 1,
        name: "Spotify",
        category: "Music",
        plan: "Premium",
        amount: "9.99",
        billing_cycle: "Monthly",
        next_payment_date: new Date("2023-05-20").toISOString(),
        status: "active",
        reminder: "None",
        notes: null,
        created_at: new Date("2023-01-10").toISOString(),
    },
    {
        id: 3,
        user_id: 2,
        name: "Adobe Creative Cloud",
        category: "Software",
        plan: "All Apps",
        amount: "52.99",
        billing_cycle: "Monthly",
        next_payment_date: new Date("2023-05-25").toISOString(),
        status: "active",
        reminder: "1 week before",
        notes: "Work subscription",
        created_at: new Date("2023-02-20").toISOString(),
    },
    {
        id: 4,
        user_id: 2,
        name: "Amazon Prime",
        category: "Shopping",
        plan: "Annual",
        amount: "139",
        billing_cycle: "Annually",
        next_payment_date: new Date("2024-02-15").toISOString(),
        status: "active",
        reminder: "1 week before",
        notes: null,
        created_at: new Date("2023-02-15").toISOString(),
    },
];

// Write to files
fs.writeFileSync(path.join(STORAGE_PATH, "users.json"), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(STORAGE_PATH, "subscriptions.json"), JSON.stringify(subscriptions, null, 2));

console.log("Sample data files created:");
console.log(`- ${path.join(STORAGE_PATH, "users.json")}`);
console.log(`- ${path.join(STORAGE_PATH, "subscriptions.json")}`);
console.log("\nRun the migration script to import this data into PostgreSQL");

// Exit with success
process.exit(0);
