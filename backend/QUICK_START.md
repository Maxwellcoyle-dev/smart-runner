# Quick Start - Database Setup

## ✅ What We've Created

1. **Database Schema** (`migrations/001_initial_schema.sql`)
   - All tables needed for the application
   - Indexes for performance
   - Default subscription plans

2. **Database Config** (`config/database.js`)
   - PostgreSQL connection pool
   - Helper functions for queries

3. **Test Script** (`test-db.js`)
   - Verify database connection
   - Check all tables exist

4. **Setup Guide** (`SETUP_SUPABASE.md`)
   - Detailed step-by-step instructions

## 🚀 Next Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install:
- `pg` - PostgreSQL client
- `dotenv` - Environment variables
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens

### 2. Set Up Environment Variables

1. Copy the example env file:
   ```bash
   cp env.example .env
   ```

2. Get your Supabase connection string:
   - Go to https://supabase.com/dashboard
   - Select project: **ai-training-app**
   - Project Settings → Database
   - Copy the **URI** connection string

3. Edit `.env` and add:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```

4. Generate secrets:
   ```bash
   # JWT Secret (32+ chars)
   openssl rand -hex 32
   
   # Encryption Key (64 hex chars)
   openssl rand -hex 32
   ```

   Add both to `.env`:
   ```
   JWT_SECRET=<generated-jwt-secret>
   ENCRYPTION_KEY=<generated-encryption-key>
   ```

### 3. Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Open `migrations/001_initial_schema.sql`
3. Copy the entire SQL script
4. Paste into SQL Editor
5. Click **Run**

### 4. Test Database Connection

```bash
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
✅ All tables: [list of 9 tables]
✅ All tests passed! Database is ready.
```

## 📋 Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Created `.env` file from `env.example`
- [ ] Added `DATABASE_URL` to `.env`
- [ ] Generated and added `JWT_SECRET`
- [ ] Generated and added `ENCRYPTION_KEY`
- [ ] Ran migration script in Supabase SQL Editor
- [ ] Verified tables in Supabase Table Editor
- [ ] Ran `node test-db.js` successfully

## 🎯 Once Database is Set Up

You're ready to move on to:
- **Phase 1.2**: User Authentication System
- Creating registration/login endpoints
- Implementing JWT middleware

## ❓ Troubleshooting

### "Cannot find module 'pg'"
Run `npm install` in the backend directory.

### "Connection refused"
- Check your `DATABASE_URL` is correct
- Verify your Supabase project is active
- Check your IP is allowed (usually auto-allowed)

### "relation 'users' does not exist"
- You haven't run the migration script yet
- Go to Supabase SQL Editor and run `001_initial_schema.sql`

### "password authentication failed"
- Double-check your password in the connection string
- Reset your database password in Supabase if needed

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Node.js Driver](https://node-postgres.com/)
- [Setup Guide](./SETUP_SUPABASE.md) - Detailed instructions

