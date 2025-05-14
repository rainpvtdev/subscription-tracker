-- Up Migration: Add 'deactivated' column to 'users'
ALTER TABLE users
ADD COLUMN deactivated BOOLEAN NOT NULL DEFAULT FALSE;

-- Down Migration: Remove 'deactivated' column from 'users'
-- (If your migration tool supports down migrations, include this as a comment or in a separate section)
-- ALTER TABLE users
-- DROP COLUMN deactivated;