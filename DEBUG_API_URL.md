# Debug API URL Issue

## Check if Environment Variable is Being Used

The manifest.json errors are just warnings - ignore those for now. Let's focus on the API calls.

## Step 1: Check Browser Console

1. Open your Vercel app: `https://smart-runner-omega.vercel.app`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Type this and press Enter:
   ```javascript
   console.log('API URL:', process.env.REACT_APP_API_URL)
   ```
5. What does it show?
   - If it shows `undefined` → env var not set correctly
   - If it shows `/api` → env var not being used (fallback)
   - If it shows `https://smart-runner-production.up.railway.app` → env var is set correctly

## Step 2: Check Network Tab

1. Open **Network** tab in Developer Tools
2. Try to login
3. Look for the login request
4. Check the **Request URL**:
   - Should be: `https://smart-runner-production.up.railway.app/api/auth/login`
   - If it's: `https://smart-runner-omega.vercel.app/api/auth/login` → env var not working

## Step 3: Verify Vercel Environment Variable

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check `REACT_APP_API_URL`:
   - **Name**: `REACT_APP_API_URL` (exact, case-sensitive)
   - **Value**: `https://smart-runner-production.up.railway.app` (no trailing slash)
   - **Environment**: Should be checked for "Production"
3. Make sure it's saved

## Step 4: Force Redeploy

After checking/updating the env var:

1. Go to Vercel → Your Project → Deployments
2. Click the three dots (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to finish
5. Clear browser cache and try again

## Step 5: Check Build Logs

1. Go to Vercel → Your Project → Deployments
2. Click on the latest deployment
3. Check the build logs
4. Look for any errors or warnings about environment variables

## Common Issues

### Issue 1: Env var not set for Production
- Make sure `REACT_APP_API_URL` is set for "Production" environment
- Preview and Development are separate

### Issue 2: Missing https://
- Value should be: `https://smart-runner-production.up.railway.app`
- Not: `smart-runner-production.up.railway.app`

### Issue 3: Trailing slash
- Value should be: `https://smart-runner-production.up.railway.app`
- Not: `https://smart-runner-production.up.railway.app/`

### Issue 4: Not redeployed
- React env vars are embedded at build time
- Must redeploy after changing env vars

## Quick Test

After redeploy, open browser console and run:
```javascript
fetch('https://smart-runner-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

Should show: `{status: "ok", timestamp: "..."}`

---

**What to report back:**
1. What does `process.env.REACT_APP_API_URL` show in console?
2. What URL is the login request going to (from Network tab)?
3. Is the env var set correctly in Vercel?

