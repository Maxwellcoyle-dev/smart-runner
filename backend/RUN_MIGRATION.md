# Run Google OAuth Database Migration

The error shows that the `google_id` column doesn't exist in your database. You need to run the migration.

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

## Step 2: Run the Migration SQL

Copy and paste this SQL into the editor:

```sql
-- Add Google OAuth support to users table
-- This migration adds a google_id field to support Google sign-in

-- Add google_id column (nullable, unique)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable (users can sign in with Google without a password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

## Step 3: Execute the Query

1. Click **Run** (or press Cmd/Ctrl + Enter)
2. You should see "Success. No rows returned" or similar success message

## Step 4: Verify the Migration

Run this query to verify the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'google_id';
```

You should see:

- `column_name`: `google_id`
- `data_type`: `character varying` (or `varchar`)
- `is_nullable`: `YES`

## Step 5: Test Google Sign-In Again

After running the migration:

1. Try Google sign-in again
2. It should work now!

## Troubleshooting

### If you get "column already exists" error:

- That's fine! The `IF NOT EXISTS` clause should prevent this, but if it happens, the column already exists and you can proceed.

### If you get permission errors:

- Make sure you're using the SQL Editor (not the Table Editor)
- You should have admin access to your Supabase project

### If the migration partially fails:

- Check which step failed
- You can run the individual ALTER TABLE commands one at a time
