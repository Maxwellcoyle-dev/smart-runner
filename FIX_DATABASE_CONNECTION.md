# Fix Database Connection Error

The error `connect ENETUNREACH` means Railway can't connect to Supabase. This is usually a connection string issue.

## The Problem

Railway is trying to connect to Supabase but can't reach it. Common causes:
1. Wrong connection string format
2. Using direct connection instead of connection pooler
3. IP restrictions in Supabase
4. IPv6 vs IPv4 issue

## Solution: Use Connection Pooler

Supabase has two types of connection strings:
1. **Direct connection** - Doesn't work well from Railway
2. **Connection pooler** - Works better for serverless/cloud deployments

## Step 1: Get Connection Pooler URL

1. Go to Supabase Dashboard → Your Project
2. Go to **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Look for **"Connection pooling"** tab
5. Select **"Transaction"** mode
6. Copy the connection string
7. It should look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   Note: Port **6543** (pooler) not **5432** (direct)

## Step 2: Update Railway Variable

1. Go to Railway → Your Backend Service → Variables
2. Find `DATABASE_URL`
3. Update it with the **connection pooler** URL
4. Make sure to replace `[PASSWORD]` with your actual database password
5. Railway will auto-redeploy

## Step 3: Verify Connection

After redeploy, check Railway logs for:
- `Connected to PostgreSQL database` ✅
- Or connection errors ❌

## Alternative: Check Supabase IP Restrictions

1. Go to Supabase Dashboard → Settings → Database
2. Check **"Network Restrictions"** or **"IP Allowlist"**
3. Make sure Railway IPs are allowed (or allow all if testing)
4. Supabase free tier usually allows all connections by default

## Connection String Formats

### ❌ Direct Connection (may not work)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### ✅ Connection Pooler (recommended)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

Note the differences:
- `postgres.[PROJECT-REF]` instead of `postgres`
- `pooler.supabase.com` instead of `db.[PROJECT-REF].supabase.co`
- Port `6543` instead of `5432`

## Quick Test

After updating, try registering again. If it still fails, check Railway logs for the exact error message.

---

**Next Steps:**
1. Get connection pooler URL from Supabase
2. Update `DATABASE_URL` in Railway
3. Wait for redeploy
4. Try registering again

