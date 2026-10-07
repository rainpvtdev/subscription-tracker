import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    name: text("name"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    deactivated: boolean("deactivated").default(false).notNull(),
    currency: text("currency").default("USD").notNull(), // Add currency field
    reminder_days: integer("reminder_days").default(3), // Using snake_case to match DB
    email_notifications: boolean("email_notifications").default(true), // Using snake_case to match DB
  });

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    email: true,
    name: true,
});

// Subscription schema
export const subscriptions = pgTable("subscriptions", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
        .notNull()
        .references(() => users.id),
    name: text("name").notNull(),
    category: text("category").notNull(),
    plan: text("plan").notNull(),
    amount: numeric("amount").notNull(),
    billing_cycle: text("billing_cycle").notNull(),
    next_payment_date: timestamp("next_payment_date").notNull(),
    status: text("status").notNull().default("active"),
    reminder: text("reminder").default("none"),
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

// Add reset tokens table to schema
export const resetTokens = pgTable("reset_tokens", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => users.id),
    token: text("token").notNull(),
    expires_at: timestamp("expires_at").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
});


export const insertSubscriptionSchema = createInsertSchema(subscriptions)
    .omit({
        id: true,
        created_at: true,
    })
    .extend({
        amount: z.coerce.number().positive("Amount must be positive"),
        // More flexible date validation that accepts ISO strings and Date objects
        next_payment_date: z.union([z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid date format"), z.date()]).transform((val) => new Date(val)),
    });

// Define category options
export const categoryOptions = ["Entertainment", "Software", "Music", "Shopping", "Gaming", "Productivity", "Other"] as const;

// Define billing cycle options
export const billing_cycleOptions = ["Monthly", "Quarterly", "Semi-Annually", "Annually"] as const;

// Define reminder options
export const reminderOptions = ["None", "1 day before", "3 days before", "1 week before"] as const;

// Define status options
export const statusOptions = ["active", "expired", "renewing soon", "canceled"] as const;

// Define currency options
export const currencyOptions = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "INR", "CNY"] as const;

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Category = (typeof categoryOptions)[number];
export type billing_cycle = (typeof billing_cycleOptions)[number];
export type Reminder = (typeof reminderOptions)[number];
export type Status = (typeof statusOptions)[number];
export type Currency = (typeof currencyOptions)[number];
