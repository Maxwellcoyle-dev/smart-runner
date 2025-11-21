# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the Garmin Training Dashboard.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `email` and `profile`
   - Add test users if needed (for testing before verification)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Garmin Training Dashboard" (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production backend URL (e.g., `https://your-backend.railway.app`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local development)
     - `https://your-backend.railway.app/api/auth/google/callback` (for production)
7. Copy the **Client ID** and **Client Secret**

## Step 2: Update Environment Variables

Add the following to your `.env` file (or Railway environment variables):

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=http://localhost:3000  # or your production backend URL
FRONTEND_URL=http://localhost:3001  # or your production frontend URL
```

## Step 3: Run Database Migration

Run the migration to add Google OAuth support to your database:

```sql
-- The migration file is at: backend/migrations/002_add_google_oauth.sql
-- Run this in your Supabase SQL editor or via your database client
```

Or if you have a migration runner, execute:

```bash
# Apply the migration
psql $DATABASE_URL -f backend/migrations/002_add_google_oauth.sql
```

## Step 4: Restart Your Backend Server

After updating environment variables, restart your backend server:

```bash
cd backend
npm start
```

## How It Works

1. User clicks "Sign in with Google" on the login or register page
2. User is redirected to Google's OAuth consent screen
3. After authorization, Google redirects back to `/api/auth/google/callback`
4. Backend creates or finds the user account
5. Backend generates a JWT token
6. User is redirected to frontend with the token
7. Frontend stores the token and logs the user in

## Features

- **Automatic Account Linking**: If a user signs up with email/password and later signs in with Google using the same email, their accounts are automatically linked
- **New User Creation**: New users can sign up directly with Google (no password required)
- **Existing User Login**: Users who previously signed up with Google can sign in again

## Troubleshooting

### "Google OAuth not configured" error

- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables
- Restart your backend server after adding the variables

### Redirect URI mismatch

- Make sure the redirect URI in Google Cloud Console exactly matches: `{BACKEND_URL}/api/auth/google/callback`
- Check that `BACKEND_URL` environment variable is set correctly

### "No email found in Google profile"

- Make sure you've requested the `email` scope (already included in the code)
- Check that the user's Google account has an email address

### Database errors

- Make sure you've run the migration to add the `google_id` column to the `users` table
- Verify that `password_hash` can be NULL (the migration handles this)
