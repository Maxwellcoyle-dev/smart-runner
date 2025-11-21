# Setting Environment Variables in Railway

**Important**: `.env` files are for local development only. In Railway, you must set environment variables in the Railway dashboard.

## How to Set Environment Variables in Railway

1. Go to Railway Dashboard → Your Backend Service
2. Click on **"Variables"** tab
3. Click **"New Variable"** for each variable you need

## Required Environment Variables

Add these one by one:

### 1. DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Your Supabase connection string
  - Example: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
  - Get from: Supabase Dashboard → Settings → Database → Connection string

### 2. JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: Generate with: `openssl rand -hex 32`
  - Should be 64 hex characters
  - Example: `a1b2c3d4e5f6...` (64 chars total)

### 3. ENCRYPTION_KEY
- **Name**: `ENCRYPTION_KEY`
- **Value**: Generate with: `openssl rand -hex 32`
  - Should be 64 hex characters
  - Different from JWT_SECRET!

### 4. NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`

### 5. ALLOWED_ORIGINS
- **Name**: `ALLOWED_ORIGINS`
- **Value**: Your Vercel domain(s)
  - Example: `https://smart-runner-omega.vercel.app,https://*.vercel.app`

### 6. FRONTEND_URL (optional)
- **Name**: `FRONTEND_URL`
- **Value**: Your main Vercel domain
  - Example: `https://smart-runner-omega.vercel.app`

## Generate Secrets Locally

Run these commands in your terminal:

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate ENCRYPTION_KEY (different from JWT_SECRET!)
openssl rand -hex 32
```

Copy each output and paste into Railway.

## After Setting Variables

1. Railway will **automatically redeploy** when you add/update variables
2. Wait for redeploy to complete
3. Check logs to verify server starts correctly
4. Try registering again

## Verify Variables Are Set

1. Railway → Your Service → Variables tab
2. You should see all the variables listed
3. Make sure they're all there and values are correct

## Common Mistakes

❌ **Setting in .env file** - Doesn't work in Railway
❌ **Using same value for JWT_SECRET and ENCRYPTION_KEY** - Must be different
❌ **Missing https:// in ALLOWED_ORIGINS** - Must include protocol
❌ **Not waiting for redeploy** - Railway redeploys automatically, wait for it

---

**Next Steps:**
1. Set `JWT_SECRET` in Railway (generate with `openssl rand -hex 32`)
2. Set `ENCRYPTION_KEY` in Railway (generate with `openssl rand -hex 32`)
3. Wait for Railway to redeploy
4. Try registering again

