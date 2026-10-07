-- Up Migration: Add currency and notification preferences columns to 'users'
ALTER TABLE users
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN reminder_days INTEGER NOT NULL DEFAULT 3;

-- Down Migration: Remove added columns from 'users'
-- (If your migration tool supports down migrations, include this section)
-- ALTER TABLE users
-- DROP COLUMN currency,
-- DROP COLUMN email_notifications,
-- DROP COLUMN reminder_days;
