# Database Migrations

This directory contains SQL migration scripts for setting up the database schema.

## Setup Instructions

### 1. Run Initial Schema

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `001_initial_schema.sql`
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the migration

### 2. Verify Tables

After running the migration, verify the tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see the following tables:
   - `users`
   - `garmin_credentials`
   - `activities`
   - `daily_summaries`
   - `sync_logs`
   - `subscription_plans`
   - `usage_tracking`
   - `ai_analyses`
   - `training_plans`

### 3. Get Database Connection String

1. Go to **Project Settings** → **Database**
2. Find the **Connection string** section
3. Copy the **URI** connection string (it will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. Save this for your `.env` file

### 4. Update Subscription Plans with Real Stripe Price IDs

After creating products/prices in Stripe:

1. Go to **SQL Editor** in Supabase
2. Run this query to update the Stripe price IDs:

```sql
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxx' 
WHERE tier = 'pro';

UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxx' 
WHERE tier = 'premium';
```

Replace `price_xxxxx` with your actual Stripe price IDs.

## Migration Order

Migrations should be run in numerical order:
1. `001_initial_schema.sql` - Initial schema setup

## Notes

- Supabase automatically handles UUID generation with the `uuid-ossp` extension
- All timestamps use `TIMESTAMP` type (Supabase handles timezone conversion)
- JSONB columns allow flexible storage of activity and summary data
- Indexes are created for common query patterns

