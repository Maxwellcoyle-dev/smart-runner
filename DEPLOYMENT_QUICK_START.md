# Quick Deployment Guide 🚀

Get your app live in 30 minutes so your wife and brother can test it!

## What We're Deploying

- **Backend**: Railway (free tier)
- **Frontend**: Vercel (free tier)
- **Database**: Supabase (already set up - free tier)

**Total Cost**: $0/month for testing! 🎉

## Prerequisites

✅ Code is in GitHub  
✅ Supabase database is set up  
✅ You have 30 minutes  

## Step-by-Step Deployment

### Part 1: Deploy Backend (Railway) - 15 minutes

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect Node.js

3. **Configure Service**
   - Railway should auto-detect `backend/` directory
   - If not, set root directory to `backend`
   - Click on the service → Settings → Root Directory → `backend`

4. **Add Environment Variables**
   - Click "Variables" tab
   - Add these (one by one):

   ```
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=generate-with-openssl-rand-hex-32
   ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend.vercel.app
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   GARMINDB_PYTHON=/usr/bin/python3
   GARMINDB_CLI=/root/.local/bin/garmindb_cli.py
   DATA_DIR=/app/data
   ```

   **To generate secrets:**
   ```bash
   openssl rand -hex 32  # For JWT_SECRET
   openssl rand -hex 32  # For ENCRYPTION_KEY
   ```

5. **Deploy**
   - Railway auto-deploys on push
   - Or click "Deploy" button
   - Wait for "Deploy Succeeded"
   - Copy the URL (e.g., `https://your-app.railway.app`)

### Part 2: Deploy Frontend (Vercel) - 10 minutes

1. **Sign up for Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build` (auto-detected)
     - **Output Directory**: `build` (auto-detected)

3. **Add Environment Variable**
   - Go to Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL=https://your-backend.railway.app
     ```
     (Use the Railway URL from Part 1)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Copy the URL (e.g., `https://your-app.vercel.app`)

### Part 3: Update CORS - 5 minutes

1. **Go back to Railway**
   - Backend service → Variables
   - Update `ALLOWED_ORIGINS`:
     ```
     ALLOWED_ORIGINS=https://your-frontend.vercel.app
     ```
   - Update `FRONTEND_URL`:
     ```
     FRONTEND_URL=https://your-frontend.vercel.app
     ```
   - Railway will auto-redeploy

### Part 4: Test! 🎉

1. Visit your frontend URL
2. Register a new account
3. Connect Garmin account
4. Sync data
5. Share URL with your wife and brother!

## Quick Reference

### Get Your Supabase Connection String

1. Go to https://supabase.com/dashboard
2. Select project: **ai-training-app**
3. Settings → Database
4. Copy "Connection string" (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password

### Generate Secrets

```bash
# JWT Secret
openssl rand -hex 32

# Encryption Key  
openssl rand -hex 32
```

### URLs You'll Need

- **Backend URL**: `https://your-app.railway.app`
- **Frontend URL**: `https://your-app.vercel.app`
- **Supabase URL**: Already have it!

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Verify Supabase project is active
- Check password in connection string

### "CORS error"
- Make sure `ALLOWED_ORIGINS` includes your Vercel URL
- Include `https://` in the URL
- Redeploy backend after updating

### "garmindb not found"
- This is okay for initial testing
- Users can still register and login
- Sync will need garmindb installed (we can fix this later)

### Frontend shows "Cannot connect to backend"
- Check `REACT_APP_API_URL` in Vercel
- Verify backend is running (visit backend URL)
- Check browser console for errors

## What Works Without garmindb

Even if garmindb isn't installed yet:
- ✅ User registration/login
- ✅ Garmin credential storage
- ✅ Dashboard UI
- ❌ Actual data sync (needs garmindb)

You can test the full flow once garmindb is set up, but the app structure is ready!

## Next Steps After Deployment

1. Test with your account
2. Share URL with testers
3. Get feedback
4. Fix any issues
5. Add garmindb support if needed

---

**Ready?** Let's deploy! Start with Part 1 above. 🚀

