# Local Testing Guide - Authentication System

This guide will help you test the authentication system locally.

## Prerequisites

1. ✅ Supabase database is set up and migration has been run
2. ✅ You have your Supabase connection string
3. ✅ Node.js and npm are installed

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

This should install:
- express, cors, fs-extra, sqlite3 (existing)
- pg, dotenv, bcrypt, jsonwebtoken (new)

### Frontend
```bash
cd frontend
npm install
```

This should install:
- react-router-dom (new)
- All existing React dependencies

## Step 2: Set Up Environment Variables

### Backend `.env` file

1. Create `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit `.env` and add your values:

   ```bash
   # Database - Get from Supabase Dashboard → Settings → Database
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   
   # JWT Secret - Generate with: openssl rand -hex 32
   JWT_SECRET=your-generated-secret-here-min-32-characters
   
   # Encryption Key - Generate with: openssl rand -hex 32
   ENCRYPTION_KEY=your-generated-encryption-key-64-hex-characters
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3001
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
   ```

3. **Generate secrets** (run these commands):
   ```bash
   # Generate JWT secret
   openssl rand -hex 32
   
   # Generate encryption key
   openssl rand -hex 32
   ```

4. **Get Supabase connection string**:
   - Go to https://supabase.com/dashboard
   - Select your project: **ai-training-app**
   - Go to **Settings** → **Database**
   - Copy the **Connection string** under "Connection pooling"
   - Replace `[YOUR-PASSWORD]` with your database password

## Step 3: Verify Database Connection

Test that your database is set up correctly:

```bash
cd backend
node test-db.js
```

You should see:
```
✅ Database connection successful!
✅ Users table exists, row count: 0
✅ Subscription plans found: 3
   - free: $0.00
   - pro: $9.99
   - premium: $19.99
✅ All tables: [list of tables]
✅ All tests passed! Database is ready.
```

If you see errors, check:
- DATABASE_URL is correct in `.env`
- Migration script was run in Supabase
- Database password is correct

## Step 4: Start the Servers

### Terminal 1 - Backend Server
```bash
cd backend
npm start
```

You should see:
```
Connected to PostgreSQL database
Garmin API server running on http://localhost:3000
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm start
```

This will:
- Start the React dev server on http://localhost:3001
- Automatically open your browser
- Proxy API requests to http://localhost:3000

## Step 5: Test Authentication Flow

### Test 1: Registration

1. Go to http://localhost:3001/register
2. Fill in the form:
   - Email: `test@example.com`
   - Password: `password123` (min 8 characters)
   - Confirm Password: `password123`
3. Click "Sign Up"
4. **Expected**: 
   - Redirects to dashboard (http://localhost:3001/)
   - You see "🏃 Training Dashboard"
   - Your email appears in the header
   - "free" badge might appear (if subscription tier is shown)

### Test 2: Logout

1. Click the "Logout" button in the header
2. **Expected**:
   - Redirects to http://localhost:3001/login
   - Token is cleared from localStorage

### Test 3: Login

1. You should be on the login page
2. Enter your credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"
4. **Expected**:
   - Redirects to dashboard
   - Your email appears in header

### Test 4: Protected Routes

1. While logged out, try to access http://localhost:3001/
2. **Expected**:
   - Automatically redirects to `/login`
   - Cannot access dashboard without authentication

### Test 5: API Protection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Login to the app
4. Look at any API request (e.g., `/api/running`)
5. Check the **Headers** section
6. **Expected**:
   - See `Authorization: Bearer <long-token-string>` header
   - Request succeeds (200 status)

### Test 6: Invalid Token Handling

1. While logged in, open browser console
2. Run: `localStorage.removeItem('token')`
3. Try to refresh the page or navigate
4. **Expected**:
   - API calls return 401
   - Automatically redirects to `/login`

### Test 7: Database Verification

1. Go to Supabase Dashboard → **Table Editor**
2. Open the `users` table
3. **Expected**:
   - See your test user with email `test@example.com`
   - `password_hash` is a long hashed string (not plain text)
   - `subscription_tier` is `free`
   - `created_at` timestamp is set

## Step 6: Test API Endpoints Directly

You can test the API endpoints using curl or Postman:

### Test Registration (Public)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test2@example.com",
    "subscription_tier": "free"
  },
  "token": "jwt-token-here"
}
```

### Test Login (Public)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Response**: Same as registration

### Test Protected Endpoint (Requires Token)
```bash
# First, get a token from login
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/api/running \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**: 
- If token is valid: Returns running activities
- If token is missing/invalid: `{"error": "Access token required"}` or `{"error": "Invalid or expired token"}`

### Test Health Check (Public - No Auth Required)
```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "Garmin API is running"
}
```

## Common Issues & Troubleshooting

### Issue: "Cannot find module 'react-router-dom'"
**Solution**: 
```bash
cd frontend
npm install
```

### Issue: "JWT_SECRET is not defined"
**Solution**: 
- Check that `.env` file exists in `backend/` directory
- Verify `JWT_SECRET` is set in `.env`
- Restart the backend server after adding to `.env`

### Issue: "Database connection failed"
**Solution**:
- Verify `DATABASE_URL` in `.env` is correct
- Check Supabase project is active
- Verify database password is correct
- Run `node test-db.js` to test connection

### Issue: "401 Unauthorized" on all API calls
**Solution**:
- Check token exists: Open browser console, run `localStorage.getItem('token')`
- Verify token is being sent: Check Network tab → Headers → Authorization
- Check JWT_SECRET matches between token creation and verification
- Token might be expired (7 days) - try logging in again

### Issue: Redirect loop on login
**Solution**:
- Clear localStorage: `localStorage.clear()` in browser console
- Check browser console for errors
- Verify backend is running on port 3000
- Check CORS settings in backend

### Issue: "Email already exists" when trying to register
**Solution**: 
- This is expected if you already registered
- Try a different email or login instead

### Issue: Frontend shows "Loading..." forever
**Solution**:
- Check backend is running
- Check browser console for errors
- Verify API proxy is working (check Network tab)
- Check that `/api/auth/me` endpoint is accessible

### Issue: "Invalid credentials" on login
**Solution**:
- Verify email and password are correct
- Check that user exists in database (Supabase Table Editor)
- Try registering again with a new email

## Verification Checklist

Before moving to the next phase, verify:

- [ ] Can register a new user
- [ ] Can login with registered credentials
- [ ] Can logout
- [ ] Protected routes redirect to login when not authenticated
- [ ] Dashboard shows user email in header
- [ ] API calls include Authorization header
- [ ] Protected API endpoints return 401 without token
- [ ] User is created in Supabase database
- [ ] Password is hashed (not plain text) in database
- [ ] Token is stored in localStorage
- [ ] Invalid/expired tokens redirect to login

## Next Steps

Once all tests pass, you're ready to move on to:
- **Phase 1.3: Garmin Credential Management**
- Store encrypted Garmin credentials per user
- Update sync to use user-specific credentials

## Quick Test Script

Run this in browser console after logging in to verify everything works:

```javascript
// Check token exists
console.log('Token:', localStorage.getItem('token') ? '✅ Exists' : '❌ Missing');

// Test API call
fetch('/api/running', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
  .then(r => r.json())
  .then(data => console.log('API Test:', data.count ? '✅ Working' : '❌ Failed', data))
  .catch(err => console.error('API Error:', err));
```

---

**Need Help?** Check the browser console and backend terminal for error messages. Most issues are related to missing environment variables or database connection problems.

