# Debugging 500 Error on Registration/Login

The 500 error means the backend is crashing. Let's find out why.

## Step 1: Check Railway Logs

1. Go to Railway Dashboard → Your Backend Service
2. Click on **"Logs"** tab
3. Look for error messages around the time you tried to register
4. Common errors you might see:
   - Database connection errors
   - "JWT_SECRET is not defined"
   - "Table 'users' does not exist"
   - Connection timeout errors

## Step 2: Verify Environment Variables in Railway

Go to Railway → Your Backend Service → **Variables** tab

**Required variables:**
- ✅ `DATABASE_URL` - Your Supabase connection string
- ✅ `JWT_SECRET` - Generated secret (32+ characters)
- ✅ `ENCRYPTION_KEY` - Generated key (64 hex characters)
- ✅ `NODE_ENV=production`
- ✅ `ALLOWED_ORIGINS` - Your Vercel domain(s)

## Step 3: Common Issues

### Issue 1: Database Connection Failed

**Error in logs:** `Connection refused` or `timeout`

**Fix:**
- Check `DATABASE_URL` is correct
- Verify Supabase project is active
- Check password in connection string
- Verify Supabase allows connections from Railway IPs

### Issue 2: JWT_SECRET Missing

**Error in logs:** `JWT_SECRET is not defined` or `secretOrPrivateKey must have a value`

**Fix:**
- Add `JWT_SECRET` to Railway variables
- Generate with: `openssl rand -hex 32`
- Make sure it's at least 32 characters

### Issue 3: Database Tables Don't Exist

**Error in logs:** `relation "users" does not exist`

**Fix:**
- Go to Supabase Dashboard → SQL Editor
- Run the migration script: `backend/migrations/001_initial_schema.sql`
- Verify tables exist in Table Editor

### Issue 4: ENCRYPTION_KEY Missing

**Error in logs:** `ENCRYPTION_KEY environment variable not set`

**Fix:**
- Add `ENCRYPTION_KEY` to Railway variables
- Generate with: `openssl rand -hex 32`

## Step 4: Test Database Connection

You can test the database connection by checking Railway logs when the server starts. Look for:
- `Connected to PostgreSQL database` ✅
- Or connection errors ❌

## Step 5: Check Specific Error

Look at the Railway logs for the exact error message. It will tell you what's wrong.

## Quick Checklist

- [ ] `DATABASE_URL` is set in Railway
- [ ] `JWT_SECRET` is set in Railway (32+ chars)
- [ ] `ENCRYPTION_KEY` is set in Railway (64 hex chars)
- [ ] Database migration has been run in Supabase
- [ ] Railway logs show database connection success
- [ ] No errors in Railway logs when server starts

---

**What to do:**
1. Check Railway logs and find the error message
2. Share the error message with me
3. Or verify all environment variables are set correctly

