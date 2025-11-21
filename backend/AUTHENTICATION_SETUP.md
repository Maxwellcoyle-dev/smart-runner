# Authentication Setup Complete ✅

## What Was Created

### Backend

1. **`middleware/auth.js`** - JWT authentication middleware
   - Verifies JWT tokens
   - Attaches user info to request
   - Protects API routes

2. **`routes/auth.js`** - Authentication endpoints
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `GET /api/auth/me` - Get current user
   - `POST /api/auth/logout` - Logout (client-side)

3. **Updated `server.js`**
   - Added dotenv for environment variables
   - Mounted auth routes at `/api/auth`

### Frontend

1. **`contexts/AuthContext.js`** - Authentication context
   - Manages user state and token
   - Provides login, register, logout functions
   - Auto-verifies token on app load

2. **`components/ProtectedRoute.js`** - Route protection
   - Redirects to login if not authenticated
   - Shows loading state while checking auth

3. **`pages/Login.js`** - Login page
   - Email/password form
   - Error handling
   - Link to registration

4. **`pages/Register.js`** - Registration page
   - Email/password/confirm password
   - Validation
   - Link to login

5. **`pages/Auth.css`** - Styling for auth pages

6. **`pages/Dashboard.js`** - Main dashboard (moved from App.js)
   - Protected route
   - All existing dashboard functionality

7. **`AppRouter.js`** - Routing setup
   - `/login` - Login page
   - `/register` - Registration page
   - `/` - Protected dashboard

8. **Updated `index.js`** - Uses AppRouter instead of App

## Testing the Authentication

### 1. Start the Backend

```bash
cd backend
npm install  # If you haven't already
npm start
```

Make sure your `.env` file has:
- `DATABASE_URL` - Supabase connection string
- `JWT_SECRET` - Secret for signing tokens

### 2. Start the Frontend

```bash
cd frontend
npm install  # If you haven't already (to get react-router-dom)
npm start
```

### 3. Test Registration

1. Go to http://localhost:3001/register
2. Enter email and password (min 8 chars)
3. Click "Sign Up"
4. Should redirect to dashboard

### 4. Test Login

1. Go to http://localhost:3001/login
2. Enter your credentials
3. Click "Login"
4. Should redirect to dashboard

### 5. Test Protected Routes

1. Try accessing http://localhost:3001/ directly
2. If not logged in, should redirect to `/login`
3. After login, should show dashboard

### 6. Test Logout

Add a logout button to the Header component (see next steps)

## Next Steps

### 1. Add Logout Button to Header

Update `frontend/src/components/Header/Header.js` to include:

```javascript
import { useAuth } from '../../contexts/AuthContext';

// In the Header component:
const { user, logout } = useAuth();

// Add logout button in the header
<button onClick={logout}>Logout</button>
```

### 2. Update API Calls to Include Token

All API calls need to include the JWT token. Update your API utility functions:

```javascript
// frontend/src/utils/api.js
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

export async function fetchRunningActivities() {
  const response = await fetch('/api/running', {
    headers: getAuthHeaders(),
  });
  // ... rest of function
}
```

### 3. Protect Existing API Endpoints

Update `server.js` to protect routes with authentication:

```javascript
const { authenticateToken } = require('./middleware/auth');

// Protect routes
app.get('/api/running', authenticateToken, async (req, res) => {
  // Now req.user is available
  const userId = req.user.id;
  // ... rest of handler
});
```

### 4. Add User Info to Header

Show the logged-in user's email in the header:

```javascript
{user && <span>Logged in as {user.email}</span>}
```

## API Endpoints

### POST /api/auth/register
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free"
  },
  "token": "jwt-token-here"
}
```

### POST /api/auth/login
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free"
  },
  "token": "jwt-token-here"
}
```

### GET /api/auth/me
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription_tier": "free",
    "subscription_status": "active"
  }
}
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Email is normalized (lowercase, trimmed)
- Password minimum length: 8 characters

## Troubleshooting

### "Cannot find module 'react-router-dom'"
Run `npm install` in the frontend directory.

### "JWT_SECRET is not defined"
Make sure your `.env` file has `JWT_SECRET` set.

### "Database connection failed"
Verify your `DATABASE_URL` in `.env` is correct.

### Login/Register not working
- Check browser console for errors
- Check backend logs for errors
- Verify backend is running on port 3000
- Verify frontend proxy is set correctly in `package.json`

### Redirect loop
- Check that token is being stored in localStorage
- Verify JWT_SECRET matches between token creation and verification
- Check browser console for errors

