# Custom Domain Setup Guide

This guide will help you set up `smart-runner.cyberfoxai.com` for your app.

## Prerequisites

- Domain: `cyberfoxai.com` (managed in Route53)
- Frontend: Deployed on Vercel
- Backend: Deployed on Railway

## Step 1: Set Up Frontend Custom Domain in Vercel

### 1.1 Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `smart-runner.cyberfoxai.com`
6. Click **Add**

### 1.2 Configure DNS in Route53

Vercel will show you DNS records to add. You'll need to add a CNAME record:

1. Go to [AWS Route53 Console](https://console.aws.amazon.com/route53/)
2. Select your hosted zone for `cyberfoxai.com`
3. Click **Create Record**
4. Configure:
   - **Record name**: `smart-runner`
   - **Record type**: `CNAME`
   - **Value**: `cname.vercel-dns.com` (or the value Vercel provides)
   - **TTL**: 300 (or default)
5. Click **Create records**

### 1.3 Wait for DNS Propagation

- DNS changes can take 5-60 minutes to propagate
- Vercel will show "Valid Configuration" when it's ready
- You can check status in Vercel → Settings → Domains

## Step 2: Set Up Backend Custom Domain in Railway

### 2.1 Add Custom Domain in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your backend service
3. Go to **Settings** → **Networking**
4. Scroll to **Custom Domain** section
5. Click **Add Custom Domain**
6. Enter: `api.smart-runner.cyberfoxai.com` (or `backend.smart-runner.cyberfoxai.com`)
7. Railway will provide DNS records to add

### 2.2 Configure DNS in Route53

Add the DNS records Railway provides (usually a CNAME):

1. Go to Route53
2. Create a new record:
   - **Record name**: `api.smart-runner` (or `backend.smart-runner`)
   - **Record type**: `CNAME`
   - **Value**: The value Railway provides (e.g., `xxx.railway.app`)
   - **TTL**: 300
3. Click **Create records**

### 2.3 Wait for DNS Propagation

- Wait 5-60 minutes for DNS to propagate
- Railway will show when the domain is active

## Step 3: Update Google OAuth Credentials

### 3.1 Update Authorized JavaScript Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   ```
   https://smart-runner.cyberfoxai.com
   https://api.smart-runner.cyberfoxai.com
   ```
   (Keep your existing localhost entries for local development)

### 3.2 Update Authorized Redirect URIs

Under **Authorized redirect URIs**, add:

```
https://api.smart-runner.cyberfoxai.com/api/auth/google/callback
```

(Keep your existing localhost entry for local development)

### 3.3 Save Changes

Click **Save** at the bottom of the page.

## Step 4: Update Environment Variables

### 4.1 Update Railway Environment Variables

1. Go to Railway → Your Backend Service → **Variables**
2. Update these variables:
   ```env
   BACKEND_URL=https://api.smart-runner.cyberfoxai.com
   FRONTEND_URL=https://smart-runner.cyberfoxai.com
   ALLOWED_ORIGINS=https://smart-runner.cyberfoxai.com,https://api.smart-runner.cyberfoxai.com
   ```
3. Railway will auto-redeploy

### 4.2 Update Vercel Environment Variables

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Update:
   ```env
   REACT_APP_API_URL=https://api.smart-runner.cyberfoxai.com
   ```
3. **IMPORTANT**: After updating, you MUST redeploy:
   - Go to **Deployments**
   - Click **⋯** on latest deployment
   - Click **Redeploy**
   - Uncheck "Use existing Build Cache"
   - Click **Redeploy**

## Step 5: Verify Everything Works

### 5.1 Test Frontend

1. Visit: `https://smart-runner.cyberfoxai.com`
2. Should load your app
3. Go to login page: `https://smart-runner.cyberfoxai.com/login`

### 5.2 Test Backend

1. Visit: `https://api.smart-runner.cyberfoxai.com/health`
2. Should return: `{"status":"ok","timestamp":"..."}`

### 5.3 Test Google OAuth

1. Go to: `https://smart-runner.cyberfoxai.com/login`
2. Click "Sign in with Google"
3. Should redirect to Google sign-in
4. After signing in, should redirect back and log you in

## Troubleshooting

### DNS Not Propagating

- Wait up to 60 minutes
- Check DNS propagation: https://dnschecker.org
- Verify records in Route53 match what Vercel/Railway provided

### SSL Certificate Issues

- Vercel and Railway automatically provision SSL certificates
- May take a few minutes after DNS propagates
- If issues persist, wait 10-15 minutes and try again

### OAuth Redirect Errors

- Verify redirect URI in Google Console exactly matches: `https://api.smart-runner.cyberfoxai.com/api/auth/google/callback`
- Check that `BACKEND_URL` in Railway is set correctly
- Ensure Railway has been redeployed after updating variables

### CORS Errors

- Verify `ALLOWED_ORIGINS` in Railway includes: `https://smart-runner.cyberfoxai.com`
- Check that frontend is using the correct backend URL
- Clear browser cache and try again

## Final Configuration Summary

**Frontend URL**: `https://smart-runner.cyberfoxai.com`
**Backend URL**: `https://api.smart-runner.cyberfoxai.com`

**Google OAuth Settings**:

- Authorized JavaScript origins:
  - `http://localhost:3000` (local dev)
  - `https://smart-runner.cyberfoxai.com` (production)
  - `https://api.smart-runner.cyberfoxai.com` (production backend)
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/google/callback` (local dev)
  - `https://api.smart-runner.cyberfoxai.com/api/auth/google/callback` (production)

**Railway Variables**:

```env
BACKEND_URL=https://api.smart-runner.cyberfoxai.com
FRONTEND_URL=https://smart-runner.cyberfoxai.com
ALLOWED_ORIGINS=https://smart-runner.cyberfoxai.com,https://api.smart-runner.cyberfoxai.com
```

**Vercel Variables**:

```env
REACT_APP_API_URL=https://api.smart-runner.cyberfoxai.com
```
