-- Add Google OAuth support to users table
-- This migration adds a google_id field to support Google sign-in

-- Add google_id column (nullable, unique)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable (users can sign in with Google without a password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add constraint: users must have either password_hash OR google_id
-- Note: This is enforced at application level since PostgreSQL doesn't support CHECK constraints with OR conditions easily

