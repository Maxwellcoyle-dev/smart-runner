# Deploy to Railway - Step by Step Guide

Railway is the easiest way to deploy your app. This guide will walk you through it.

## Prerequisites

1. ✅ Code pushed to GitHub
2. ✅ Supabase database set up
3. ✅ Railway account (free at https://railway.app)

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

If you haven't already:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Verify Environment Variables

Make sure `backend/env.example` has all required variables (it does!).

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (easiest)
3. Authorize Railway to access your repositories

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `garmen_local` (or whatever it's called)
4. Railway will detect it's a Node.js project

### 2.3 Configure Backend Service

1. Railway should auto-detect the backend
2. If not, click **"Add Service"** → **"GitHub Repo"**
3. Select your repo
4. Set root directory to: `backend`
5. Railway will auto-detect Node.js

### 2.4 Add Environment Variables

1. Click on your backend service
2. Go to **"Variables"** tab
3. Add these variables (click **"New Variable"** for each):

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=[generate with: openssl rand -hex 32]
ENCRYPTION_KEY=[generate with: openssl rand -hex 32]
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-url.railway.app
ALLOWED_ORIGINS=https://your-frontend-url.railway.app,https://your-frontend-domain.com
GARMINDB_PYTHON=/usr/bin/python3
GARMINDB_CLI=/usr/local/bin/garmindb_cli.py
DATA_DIR=/app/data
```

**Important Notes:**
- Get `DATABASE_URL` from Supabase Dashboard
- Generate secrets (don't use the examples!)
- `FRONTEND_URL` and `ALLOWED_ORIGINS` - update after deploying frontend
- For `GARMINDB_PYTHON` and `GARMINDB_CLI`, you may need to install garmindb in Railway (see below)

### 2.5 Install Python and garmindb (if needed)

Railway needs Python and garmindb. You have two options:

**Option A: Use Railway's Python (Recommended)**

1. Add a `nixpacks.toml` file in `backend/`:

```toml
[phases.setup]
nixPkgs = ["python3", "pip"]

[phases.install]
cmds = ["pip install --user garmindb"]
```

2. Update environment variables:
```
GARMINDB_PYTHON=/root/.local/bin/python3
GARMINDB_CLI=/root/.local/bin/garmindb_cli.py
```

**Option B: Use system Python (if available)**

Railway may have Python pre-installed. Check logs to see.

### 2.6 Deploy

1. Railway will auto-deploy when you push to GitHub
2. Or click **"Deploy"** button
3. Watch the logs - should see: "Garmin API server running on port 3000"
4. Copy the generated URL (e.g., `https://your-backend.railway.app`)

## Step 3: Deploy Frontend

### 3.1 Build Frontend Locally (for now)

Since Railway is better for backends, we'll deploy frontend to Vercel (free and perfect for React):

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.2 Add Environment Variables in Vercel

Go to **Settings** → **Environment Variables**:

```
REACT_APP_API_URL=https://your-backend.railway.app
```

### 3.3 Update Frontend API Base URL

We need to update the frontend to use the production API URL.

1. Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-backend.railway.app
```

2. Update `frontend/src/constants/config.js` to use this:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
```

### 3.4 Deploy

1. Vercel will auto-deploy
2. Get your frontend URL (e.g., `https://your-app.vercel.app`)

## Step 4: Update CORS and URLs

### 4.1 Update Backend CORS

Go back to Railway → Backend → Variables:

Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

Update `FRONTEND_URL`:
```
FRONTEND_URL=https://your-app.vercel.app
```

### 4.2 Redeploy Backend

Railway will auto-redeploy when you update variables, or click **"Redeploy"**.

## Step 5: Test Deployment

1. Go to your frontend URL
2. Try to register a new account
3. Connect Garmin account
4. Try syncing data
5. Verify everything works!

## Troubleshooting

### Backend won't start

- Check Railway logs
- Verify all environment variables are set
- Check `DATABASE_URL` is correct
- Verify Supabase database is accessible

### CORS errors

- Check `ALLOWED_ORIGINS` includes your frontend URL
- Make sure frontend URL matches exactly (including https://)
- Redeploy backend after updating CORS

### Database connection fails

- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Verify IP restrictions in Supabase (may need to allow Railway IPs)

### garmindb not found

- Check Python is installed in Railway
- Verify `GARMINDB_PYTHON` and `GARMINDB_CLI` paths
- May need to install garmindb in Railway build process

### Frontend can't connect to backend

- Verify `REACT_APP_API_URL` is set correctly
- Check backend is running (visit backend URL directly)
- Check browser console for errors

## Next Steps

Once deployed:
1. Share frontend URL with your wife and brother
2. Have them create accounts
3. Test the full flow
4. Monitor Railway/Vercel logs for any issues

## Cost Estimate

- **Railway**: Free tier ($5 credit/month) - should be enough for testing
- **Vercel**: Free tier (unlimited for personal projects)
- **Supabase**: Free tier (500MB database)
- **Total**: $0/month for testing! 🎉

---

**Need Help?** Check Railway and Vercel documentation, or review the logs in their dashboards.

