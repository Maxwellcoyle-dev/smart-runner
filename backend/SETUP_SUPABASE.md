# Supabase Setup Guide

This guide will walk you through setting up your Supabase database for the Garmin Training Dashboard.

## Step 1: Get Your Supabase Connection Details

1. Go to https://supabase.com/dashboard
2. Select your project: **ai-training-app**
3. Go to **Project Settings** → **Database**
4. Find the **Connection string** section
5. Copy the **URI** connection string
   - It will look like: `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
   - Or the direct connection: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. Generate a JWT secret (32+ characters):
   ```bash
   openssl rand -hex 32
   ```
   Add it to `.env`:
   ```
   JWT_SECRET=<generated-secret>
   ```

4. Generate an encryption key (64 hex characters):
   ```bash
   openssl rand -hex 32
   ```
   Add it to `.env`:
   ```
   ENCRYPTION_KEY=<generated-key>
   ```

## Step 3: Run Database Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file `backend/migrations/001_initial_schema.sql`
3. Copy the entire SQL script
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: "Success. No rows returned"

## Step 4: Verify Tables Were Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - ✅ users
   - ✅ garmin_credentials
   - ✅ activities
   - ✅ daily_summaries
   - ✅ sync_logs
   - ✅ subscription_plans
   - ✅ usage_tracking
   - ✅ ai_analyses
   - ✅ training_plans

## Step 5: Verify Default Subscription Plans

1. In **Table Editor**, open the `subscription_plans` table
2. You should see 3 rows:
   - Free tier (price: $0.00)
   - Pro tier (price: $9.99)
   - Premium tier (price: $19.99)

## Step 6: Test Database Connection

1. Install dependencies (if not already done):
   ```bash
   cd backend
   npm install pg dotenv
   ```

2. Create a test script `test-db.js`:
   ```javascript
   require('dotenv').config();
   const { pool } = require('./config/database');

   async function testConnection() {
     try {
       const result = await pool.query('SELECT NOW()');
       console.log('✅ Database connection successful!');
       console.log('Current time:', result.rows[0].now);
       
       // Test users table
       const usersResult = await pool.query('SELECT COUNT(*) FROM users');
       console.log('Users table exists, row count:', usersResult.rows[0].count);
       
       // Test subscription plans
       const plansResult = await pool.query('SELECT tier, price_monthly FROM subscription_plans');
       console.log('Subscription plans:', plansResult.rows);
       
       await pool.end();
     } catch (error) {
       console.error('❌ Database connection failed:', error.message);
       process.exit(1);
     }
   }

   testConnection();
   ```

3. Run the test:
   ```bash
   node test-db.js
   ```

You should see:
- ✅ Database connection successful!
- Current time: [timestamp]
- Users table exists, row count: 0
- Subscription plans: [3 plans]

## Step 7: Get Supabase API Keys (Optional - for direct API access)

If you want to use Supabase's client libraries later:

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

Add these to your `.env` file if you plan to use Supabase client libraries.

## Troubleshooting

### Connection Refused
- Check that your IP is allowed in Supabase (Settings → Database → Connection Pooling)
- Verify the connection string is correct
- Make sure you're using the correct password

### SSL Error
- Supabase requires SSL connections
- The config already handles this with `ssl: { rejectUnauthorized: false }`

### Table Not Found
- Make sure you ran the migration script
- Check the SQL Editor history to verify it executed successfully
- Try running the migration again

### Permission Denied
- Make sure you're using the correct database user (usually `postgres`)
- Check that your password is correct

## Next Steps

Once the database is set up, you can:
1. ✅ Move on to Phase 1.2: User Authentication System
2. ✅ Start implementing the API endpoints
3. ✅ Test user registration and login

## Useful Supabase Features

- **Table Editor**: View and edit data directly in the dashboard
- **SQL Editor**: Run custom queries
- **Database Logs**: Monitor queries and performance
- **Connection Pooling**: Better performance for serverless functions
- **Row Level Security**: Can be enabled later for additional security

