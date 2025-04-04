-- Database Schema for Subscription Tracker Application

-- Users Table
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email and username for faster lookups
CREATE INDEX idx_users_email ON "users" ("email");
CREATE INDEX idx_users_username ON "users" ("username");

-- Subscriptions Table
CREATE TABLE "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "plan" VARCHAR(100),
  "amount" DECIMAL(10, 2) NOT NULL,
  "billing_cycle" VARCHAR(20) NOT NULL,
  "next_payment_date" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "reminder" VARCHAR(50),
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups and filtering
CREATE INDEX idx_subscriptions_user_id ON "subscriptions" ("user_id");
CREATE INDEX idx_subscriptions_category ON "subscriptions" ("category");
CREATE INDEX idx_subscriptions_status ON "subscriptions" ("status");
CREATE INDEX idx_subscriptions_billing_cycle ON "subscriptions" ("billing_cycle");
CREATE INDEX idx_subscriptions_next_payment_date ON "subscriptions" ("next_payment_date");

-- Sessions Table (created by connect-pg-simple)
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE "reset_tokens" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster token lookups
CREATE INDEX idx_reset_tokens_token ON "reset_tokens" ("token");
CREATE INDEX idx_reset_tokens_user_id ON "reset_tokens" ("user_id");


-- Comments explaining the schema:

-- Users Table:
-- - Stores user authentication and profile information
-- - Has unique constraints on username and email
-- - Uses bcrypt-hashed passwords
-- - 'created_at' tracks when the account was created

-- Subscriptions Table:
-- - Stores all subscription information for users
-- - Foreign key to users table ensures referential integrity
-- - Categories are predefined in application logic
-- - 'next_payment_date' allows for payment reminders
-- - 'status' can be 'active', 'expired', 'canceled', etc.
-- - 'billing_cycle' can be 'monthly', 'yearly', 'quarterly', etc.
-- - 'reminder' allows users to set notification preferences

-- Sessions Table:
-- - Managed by connect-pg-simple for persistent sessions
-- - Automatically cleans up expired sessions
-- - 'sess' contains serialized session data
-- - 'expire' determines when the session becomes invalid