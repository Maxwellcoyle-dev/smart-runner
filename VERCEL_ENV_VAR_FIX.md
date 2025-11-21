# Fixing Vercel Environment Variable Issue

The app is still calling the Vercel domain instead of Railway. This means the environment variable isn't being used.

## The Problem

React environment variables are **embedded at build time**. If you set the env var after the first build, you MUST rebuild.

## Step-by-Step Fix

### 1. Verify Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Find `REACT_APP_API_URL`
4. **Verify the value is exactly:**
   ```
   https://smart-runner-production.up.railway.app
   ```
   - ✅ Must include `https://`
   - ✅ No trailing slash
   - ✅ Exact URL (no typos)

### 2. Check Which Environments It's Set For

Make sure `REACT_APP_API_URL` is enabled for:
- ✅ **Production** (most important!)
- ✅ **Preview** (optional, but recommended)
- ✅ **Development** (optional)

### 3. Force a Complete Rebuild

**Option A: Redeploy (Recommended)**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (⋯)
4. Click **"Redeploy"**
5. **IMPORTANT**: Make sure "Use existing Build Cache" is **UNCHECKED**
6. Click **"Redeploy"**

**Option B: Push a New Commit**
```bash
# Make a small change to trigger rebuild
echo "" >> frontend/src/App.js
git add frontend/src/App.js
git commit -m "Trigger rebuild with env vars"
git push
```

### 4. Verify After Rebuild

After Vercel finishes building:

1. Open your deployed app
2. Open Browser Console (F12)
3. Type: `window.API_BASE_URL`
4. **Should show:** `https://smart-runner-production.up.railway.app/api`
5. **If it shows:** `/api` → env var still not working

### 5. Check Build Logs

1. Go to Vercel → Deployments → Latest deployment
2. Click on the deployment
3. Check **Build Logs**
4. Look for any errors or warnings about environment variables
5. The build should show the env var is being used

## Common Issues

### Issue 1: Env Var Not Set for Production
- Make sure it's enabled for **Production** environment
- Preview and Development are separate

### Issue 2: Typo in URL
- Check for typos
- Must be exact: `https://smart-runner-production.up.railway.app`
- No trailing slash

### Issue 3: Not Rebuilt
- **Must rebuild after setting env var**
- Just saving the env var isn't enough
- Redeploy with cache disabled

### Issue 4: Build Cache
- Vercel might be using cached build
- Disable build cache when redeploying

## Quick Test

After redeploy, check browser console:
```javascript
window.API_BASE_URL
```

Should show: `https://smart-runner-production.up.railway.app/api`

If it shows `/api`, the env var isn't working.

## Alternative: Hardcode for Testing (Temporary)

If env vars still don't work, you can temporarily hardcode it:

```javascript
// frontend/src/constants/config.js
export const API_BASE_URL = "https://smart-runner-production.up.railway.app/api";
```

**Then remove this after env vars work!**

---

**Next Steps:**
1. Verify env var in Vercel
2. Redeploy with cache disabled
3. Check `window.API_BASE_URL` in browser console
4. Report back what it shows

