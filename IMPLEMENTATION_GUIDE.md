# Implementation Guide - Key Code Changes

This document provides code examples for the most critical changes needed to make the app public-facing.

## 1. Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Garmin credentials (encrypted)
CREATE TABLE garmin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  session_data JSONB,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  garmin_activity_id BIGINT NOT NULL,
  activity_data JSONB NOT NULL,
  start_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, garmin_activity_id)
);

CREATE INDEX idx_activities_user_start ON activities(user_id, start_time DESC);

-- Daily summaries
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- Sync logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  activities_synced INTEGER DEFAULT 0
);

CREATE INDEX idx_sync_logs_user_status ON sync_logs(user_id, status);
```

## 2. Authentication Middleware

```javascript
// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

## 3. User Registration & Login

```javascript
// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
```

## 4. Credential Encryption

```javascript
// backend/utils/encryption.js
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable not set");
  }
  // Key should be 32 bytes (256 bits) for AES-256
  return Buffer.from(key, "hex");
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedData, "base64");

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, TAG_POSITION);
  const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = data.slice(ENCRYPTED_POSITION);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final("utf8");
}

module.exports = { encrypt, decrypt };
```

## 5. Updated Sync Endpoint (Multi-User)

```javascript
// backend/routes/sync.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { Pool } = require("pg");
const { decrypt } = require("../utils/encryption");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const fs = require("fs-extra");
const path = require("path");

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.post("/sync", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if user has Garmin credentials
    const credResult = await pool.query(
      "SELECT encrypted_email, encrypted_password, session_data FROM garmin_credentials WHERE user_id = $1",
      [userId]
    );

    if (credResult.rows.length === 0) {
      return res.status(400).json({
        error: "Garmin account not connected",
        message: "Please connect your Garmin account in settings",
      });
    }

    const creds = credResult.rows[0];
    const email = decrypt(creds.encrypted_email);
    const password = decrypt(creds.encrypted_password);

    // Check if sync is already running
    const runningSync = await pool.query(
      "SELECT id FROM sync_logs WHERE user_id = $1 AND status = 'running'",
      [userId]
    );

    if (runningSync.rows.length > 0) {
      return res.status(409).json({
        error: "Sync already in progress",
      });
    }

    // Create sync log
    const syncLog = await pool.query(
      "INSERT INTO sync_logs (user_id, status) VALUES ($1, 'running') RETURNING id",
      [userId]
    );
    const syncLogId = syncLog.rows[0].id;

    // Create user-specific config directory
    const userConfigDir = path.join(
      process.env.DATA_DIR || "./data",
      "users",
      userId,
      "tokens"
    );
    await fs.ensureDir(userConfigDir);

    // Create GarminConnectConfig.json for this user
    const config = {
      db: { type: "sqlite" },
      garmin: { domain: "garmin.com" },
      credentials: {
        user: email,
        secure_password: false,
        password: password,
        password_file: null,
      },
      data: {
        download_latest_activities: 25,
        download_all_activities: 1000,
      },
      directories: {
        relative_to_home: false,
        base_dir: path.join(process.env.DATA_DIR || "./data", "users", userId),
      },
      enabled_stats: {
        monitoring: true,
        steps: true,
        itime: true,
        sleep: true,
        rhr: true,
        weight: true,
        activities: true,
      },
    };

    await fs.writeFile(
      path.join(userConfigDir, "GarminConnectConfig.json"),
      JSON.stringify(config, null, 2)
    );

    // Execute garmindb sync
    const workDir = path.join(
      process.env.DATA_DIR || "./data",
      "users",
      userId
    );
    const command = `cd "${workDir}" && "${process.env.GARMINDB_PYTHON}" "${process.env.GARMINDB_CLI}" -f "${userConfigDir}" -A -d -i --analyze`;

    try {
      const result = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000,
        cwd: workDir,
      });

      // Process and store synced data in database
      await processSyncedData(userId, workDir);

      // Update sync log
      await pool.query(
        "UPDATE sync_logs SET status = 'completed', completed_at = NOW() WHERE id = $1",
        [syncLogId]
      );

      // Update last sync time
      await pool.query(
        "UPDATE garmin_credentials SET last_sync = NOW() WHERE user_id = $1",
        [userId]
      );

      res.json({
        success: true,
        message: "Sync completed successfully",
      });
    } catch (execError) {
      // Update sync log with error
      await pool.query(
        "UPDATE sync_logs SET status = 'failed', completed_at = NOW(), error_message = $1 WHERE id = $2",
        [execError.message, syncLogId]
      );

      throw execError;
    }
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      error: "Sync failed",
      message: error.message,
    });
  }
});

async function processSyncedData(userId, dataDir) {
  // Read activities from JSON files and store in database
  const activitiesDir = path.join(dataDir, "FitFiles", "Activities");
  const files = await fs.readdir(activitiesDir);
  const activityFiles = files.filter(
    (f) =>
      f.startsWith("activity_") &&
      f.endsWith(".json") &&
      !f.includes("_details_")
  );

  for (const file of activityFiles) {
    const filePath = path.join(activitiesDir, file);
    const activityData = await fs.readJson(filePath);

    // Extract activity ID from filename or data
    const activityId =
      activityData.activityId || file.match(/activity_(\d+)/)?.[1];

    if (activityId) {
      await pool.query(
        `INSERT INTO activities (user_id, garmin_activity_id, activity_data, start_time)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, garmin_activity_id) 
         DO UPDATE SET activity_data = $3, start_time = $4`,
        [
          userId,
          activityId,
          JSON.stringify(activityData),
          new Date(activityData.startTimeGMT),
        ]
      );
    }
  }

  // Similar processing for daily summaries...
}

module.exports = router;
```

## 6. Updated Running Activities Endpoint

```javascript
// In backend/server.js or routes/activities.js
app.get("/api/running", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit } = req.query;

    let query = `
      SELECT activity_data, start_time
      FROM activities
      WHERE user_id = $1
      AND activity_data->>'activityType'->>'typeKey' = 'running'
    `;
    const params = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND start_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND start_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY start_time DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);

    const runningActivities = result.rows.map((row) => ({
      ...row.activity_data,
      startTimeGMT: row.start_time.toISOString(),
    }));

    res.json({
      count: runningActivities.length,
      data: runningActivities,
    });
  } catch (error) {
    console.error("Error fetching running activities:", error);
    res.status(500).json({ error: "Failed to fetch running activities" });
  }
});
```

## 7. Frontend Authentication Context

```javascript
// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
          } else {
            // Token invalid
            localStorage.removeItem("token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const register = async (email, password) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("token", data.token);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 8. Protected Route Component

```javascript
// frontend/src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

## 9. Updated API Calls with Authentication

```javascript
// frontend/src/utils/api.js
const API_BASE_URL = "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function fetchRunningActivities(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/running?${queryString}`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch running activities");
  }

  return response.json();
}
```

## 10. Environment Variables (.env.example)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/garmin_dashboard

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-64-characters-long

# GarminDB
GARMINDB_PYTHON=/usr/local/bin/python3
GARMINDB_CLI=/usr/local/bin/garmindb_cli.py

# Data Directory
DATA_DIR=./data

# Server
PORT=3000
NODE_ENV=production

# CORS (for production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 11. Subscription Management with Stripe

### Database Schema Updates

```sql
-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN subscription_current_period_end TIMESTAMP;

-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'premium'
  price_monthly DECIMAL(10, 2) NOT NULL,
  features JSONB NOT NULL,
  ai_requests_per_month INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL, -- 'ai_analysis', 'ai_plan', 'sync'
  usage_count INTEGER DEFAULT 1,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, feature_type, period_start)
);

CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period_start);
```

### Stripe Integration

```javascript
// backend/routes/subscriptions.js
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Pool } = require("pg");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create checkout session
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;

    // Get user email
    const userResult = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );
    const userEmail = userResult.rows[0].email;

    // Create or get Stripe customer
    let customerId = await getOrCreateStripeCustomer(userId, userEmail);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe webhook handler
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await handleSubscriptionCreated(session);
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case "invoice.payment_failed":
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

async function getOrCreateStripeCustomer(userId, email) {
  const userResult = await pool.query(
    "SELECT stripe_customer_id FROM users WHERE id = $1",
    [userId]
  );

  if (userResult.rows[0].stripe_customer_id) {
    return userResult.rows[0].stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: { userId: userId },
  });

  await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [
    customer.id,
    userId,
  ]);

  return customer.id;
}

async function handleSubscriptionCreated(session) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Get plan details from price ID
  const planResult = await pool.query(
    "SELECT tier FROM subscription_plans WHERE stripe_price_id = $1",
    [priceId]
  );

  if (planResult.rows.length === 0) {
    console.error("Plan not found for price ID:", priceId);
    return;
  }

  const tier = planResult.rows[0].tier;

  // Update user subscription
  await pool.query(
    `UPDATE users 
     SET subscription_tier = $1, 
         subscription_status = 'active',
         subscription_current_period_end = to_timestamp($2)
     WHERE stripe_customer_id = $3`,
    [tier, subscription.current_period_end, customerId]
  );
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0].price.id;

  const planResult = await pool.query(
    "SELECT tier FROM subscription_plans WHERE stripe_price_id = $1",
    [priceId]
  );

  if (planResult.rows.length > 0) {
    const tier = planResult.rows[0].tier;
    await pool.query(
      `UPDATE users 
       SET subscription_tier = $1,
           subscription_current_period_end = to_timestamp($2)
       WHERE stripe_customer_id = $3`,
      [tier, subscription.current_period_end, customerId]
    );
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  await pool.query(
    `UPDATE users 
     SET subscription_tier = 'free',
         subscription_status = 'canceled'
     WHERE stripe_customer_id = $1`,
    [customerId]
  );
}

module.exports = router;
```

### Subscription Middleware

```javascript
// backend/middleware/subscription.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const requireSubscription = (requiredTier) => {
  return async (req, res, next) => {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT subscription_tier, subscription_status FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { subscription_tier, subscription_status } = result.rows[0];

    if (subscription_status !== "active") {
      return res.status(403).json({
        error: "Subscription required",
        message: "Please subscribe to access this feature",
      });
    }

    const tierLevels = { free: 0, pro: 1, premium: 2 };
    const userLevel = tierLevels[subscription_tier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: "Upgrade required",
        message: `This feature requires a ${requiredTier} subscription`,
        currentTier: subscription_tier,
        requiredTier: requiredTier,
      });
    }

    next();
  };
};

module.exports = { requireSubscription };
```

### Usage Tracking

```javascript
// backend/utils/usageTracking.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsageLimit(userId, featureType) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get user's subscription tier
  const userResult = await pool.query(
    "SELECT subscription_tier FROM users WHERE id = $1",
    [userId]
  );
  const tier = userResult.rows[0]?.subscription_tier || "free";

  // Get plan limits
  const planResult = await pool.query(
    "SELECT ai_requests_per_month FROM subscription_plans WHERE tier = $1",
    [tier]
  );
  const limit = planResult.rows[0]?.ai_requests_per_month || 0;

  // Get current usage
  const usageResult = await pool.query(
    `SELECT usage_count FROM usage_tracking 
     WHERE user_id = $1 AND feature_type = $2 AND period_start = $3`,
    [userId, featureType, periodStart]
  );

  const currentUsage = usageResult.rows[0]?.usage_count || 0;

  return {
    allowed: limit === -1 || currentUsage < limit, // -1 means unlimited
    current: currentUsage,
    limit: limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
  };
}

async function incrementUsage(userId, featureType) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await pool.query(
    `INSERT INTO usage_tracking (user_id, feature_type, period_start, period_end, usage_count)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (user_id, feature_type, period_start)
     DO UPDATE SET usage_count = usage_tracking.usage_count + 1`,
    [userId, featureType, periodStart, periodEnd]
  );
}

module.exports = { checkUsageLimit, incrementUsage };
```

## 12. AI Integration for Training Analysis

### AI Service Setup

```javascript
// backend/services/aiService.js
const Anthropic = require("@anthropic-ai/sdk");
// OR for OpenAI:
// const OpenAI = require("openai");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// OR for OpenAI:
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

async function analyzeTrainingData(userId, activities, dailySummaries) {
  // Aggregate training data for AI analysis
  const trainingSummary = {
    totalRuns: activities.length,
    totalDistance: activities.reduce((sum, a) => sum + (a.distance || 0), 0),
    totalTime: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
    averagePace: calculateAveragePace(activities),
    averageHR: calculateAverageHR(activities),
    weeklyVolume: calculateWeeklyVolume(activities),
    recentTrends: analyzeTrends(activities),
  };

  const prompt = `You are an expert running coach analyzing training data. Analyze the following training data and provide insights:

Training Summary:
- Total Runs: ${trainingSummary.totalRuns}
- Total Distance: ${(trainingSummary.totalDistance / 1000).toFixed(2)} km
- Total Time: ${formatDuration(trainingSummary.totalTime)}
- Average Pace: ${formatPace(trainingSummary.averagePace)}
- Average Heart Rate: ${trainingSummary.averageHR} bpm
- Weekly Volume: ${JSON.stringify(trainingSummary.weeklyVolume)}
- Recent Trends: ${JSON.stringify(trainingSummary.recentTrends)}

Recent Activities:
${activities
  .slice(0, 10)
  .map(
    (a) =>
      `- ${new Date(a.startTimeGMT).toLocaleDateString()}: ${(
        a.distance / 1000
      ).toFixed(2)}km at ${formatPace(a.averageSpeed)}, HR: ${
        a.averageHR || "N/A"
      } bpm`
  )
  .join("\n")}

Please provide:
1. Overall training assessment
2. Strengths and areas for improvement
3. Training load analysis (too much, too little, just right)
4. Specific recommendations for improvement
5. Injury risk assessment
6. Suggested next steps

Format your response as JSON with the following structure:
{
  "assessment": "overall assessment",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "trainingLoad": "assessment",
  "recommendations": ["rec1", "rec2"],
  "injuryRisk": "low/medium/high with explanation",
  "nextSteps": ["step1", "step2"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0].text;
    // Parse JSON response
    const analysis = JSON.parse(content);
    return analysis;
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error("Failed to analyze training data");
  }
}

async function generateTrainingPlan(
  userId,
  goals,
  currentFitness,
  preferences
) {
  const prompt = `Create a personalized ${
    goals.duration
  }-week training plan for a runner with the following profile:

Current Fitness:
- Recent weekly volume: ${currentFitness.weeklyVolume} km/week
- Average pace: ${currentFitness.averagePace} min/km
- Current fitness level: ${currentFitness.level}

Goals:
- Target: ${goals.target} (e.g., "Complete a marathon", "Run 5K in 20 minutes")
- Timeline: ${goals.duration} weeks
- Preferences: ${JSON.stringify(preferences)}

Create a detailed training plan with:
1. Weekly structure
2. Daily workouts with specific paces/distances
3. Rest days
4. Progression over time
5. Tapering strategy if applicable

Format as JSON with weeks array, each containing days with workout details.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0].text;
    const plan = JSON.parse(content);
    return plan;
  } catch (error) {
    console.error("AI plan generation error:", error);
    throw new Error("Failed to generate training plan");
  }
}

// Helper functions
function calculateAveragePace(activities) {
  const speeds = activities
    .filter((a) => a.averageSpeed && a.averageSpeed > 0)
    .map((a) => a.averageSpeed);
  if (speeds.length === 0) return null;
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  return 1000 / (avgSpeed * 60); // min/km
}

function calculateAverageHR(activities) {
  const hrs = activities.filter((a) => a.averageHR).map((a) => a.averageHR);
  if (hrs.length === 0) return null;
  return Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
}

function calculateWeeklyVolume(activities) {
  // Group by week and calculate volume
  const weekly = {};
  activities.forEach((activity) => {
    const week = getWeekKey(new Date(activity.startTimeGMT));
    if (!weekly[week]) weekly[week] = 0;
    weekly[week] += activity.distance || 0;
  });
  return Object.values(weekly).map((v) => (v / 1000).toFixed(2));
}

function analyzeTrends(activities) {
  // Analyze pace, distance, frequency trends
  const recent = activities.slice(0, 10);
  const older = activities.slice(10, 20);
  // Simple trend analysis
  return {
    pace: "improving", // Calculate actual trend
    volume: "increasing",
    frequency: "consistent",
  };
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

function formatPace(minPerKm) {
  if (!minPerKm) return "N/A";
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

module.exports = { analyzeTrainingData, generateTrainingPlan };
```

### AI Endpoints

```javascript
// backend/routes/ai.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { requireSubscription } = require("../middleware/subscription");
const { checkUsageLimit, incrementUsage } = require("../utils/usageTracking");
const {
  analyzeTrainingData,
  generateTrainingPlan,
} = require("../services/aiService");
const { Pool } = require("pg");
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Analyze training data
router.post(
  "/analyze",
  authenticateToken,
  requireSubscription("pro"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Check usage limits
      const usage = await checkUsageLimit(userId, "ai_analysis");
      if (!usage.allowed) {
        return res.status(429).json({
          error: "Usage limit exceeded",
          message: `You've used all ${usage.limit} AI analyses this month. Upgrade to Premium for unlimited access.`,
          current: usage.current,
          limit: usage.limit,
        });
      }

      // Get user's activities
      const activitiesResult = await pool.query(
        `SELECT activity_data FROM activities 
         WHERE user_id = $1 
         AND activity_data->>'activityType'->>'typeKey' = 'running'
         ORDER BY (activity_data->>'startTimeGMT') DESC
         LIMIT 50`,
        [userId]
      );

      const activities = activitiesResult.rows.map((r) => r.activity_data);

      // Get daily summaries for context
      const summariesResult = await pool.query(
        `SELECT summary_data FROM daily_summaries 
         WHERE user_id = $1 
         ORDER BY date DESC 
         LIMIT 30`,
        [userId]
      );

      const dailySummaries = summariesResult.rows.map((r) => r.summary_data);

      // Analyze with AI
      const analysis = await analyzeTrainingData(
        userId,
        activities,
        dailySummaries
      );

      // Increment usage
      await incrementUsage(userId, "ai_analysis");

      // Store analysis in database
      await pool.query(
        `INSERT INTO ai_analyses (user_id, analysis_data, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, JSON.stringify(analysis)]
      );

      res.json({
        analysis,
        usage: {
          current: usage.current + 1,
          limit: usage.limit,
          remaining: usage.remaining - 1,
        },
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "Failed to analyze training data" });
    }
  }
);

// Generate training plan
router.post(
  "/generate-plan",
  authenticateToken,
  requireSubscription("premium"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { goals, preferences } = req.body;

      // Check usage
      const usage = await checkUsageLimit(userId, "ai_plan");
      if (!usage.allowed) {
        return res.status(429).json({
          error: "Usage limit exceeded",
          message: `You've used all ${usage.limit} plan generations this month.`,
        });
      }

      // Get current fitness data
      const activitiesResult = await pool.query(
        `SELECT activity_data FROM activities 
         WHERE user_id = $1 
         AND activity_data->>'activityType'->>'typeKey' = 'running'
         ORDER BY (activity_data->>'startTimeGMT') DESC
         LIMIT 20`,
        [userId]
      );

      const activities = activitiesResult.rows.map((r) => r.activity_data);
      const currentFitness = calculateCurrentFitness(activities);

      // Generate plan
      const plan = await generateTrainingPlan(
        userId,
        goals,
        currentFitness,
        preferences
      );

      // Increment usage
      await incrementUsage(userId, "ai_plan");

      // Store plan
      await pool.query(
        `INSERT INTO training_plans (user_id, plan_data, goals, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, JSON.stringify(plan), JSON.stringify(goals)]
      );

      res.json({ plan, usage });
    } catch (error) {
      console.error("Plan generation error:", error);
      res.status(500).json({ error: "Failed to generate training plan" });
    }
  }
);

function calculateCurrentFitness(activities) {
  // Calculate current fitness metrics
  const totalDistance = activities.reduce(
    (sum, a) => sum + (a.distance || 0),
    0
  );
  const weeklyVolume = totalDistance / 1000 / (activities.length / 3); // Rough estimate

  const speeds = activities
    .filter((a) => a.averageSpeed && a.averageSpeed > 0)
    .map((a) => a.averageSpeed);
  const avgSpeed =
    speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : null;
  const averagePace = avgSpeed ? 1000 / (avgSpeed * 60) : null;

  return {
    weeklyVolume: weeklyVolume.toFixed(1),
    averagePace: averagePace ? formatPace(averagePace) : null,
    level: determineFitnessLevel(weeklyVolume, averagePace),
  };
}

function determineFitnessLevel(volume, pace) {
  // Simple fitness level determination
  if (volume > 50 && pace < 5) return "advanced";
  if (volume > 30 && pace < 6) return "intermediate";
  return "beginner";
}

function formatPace(minPerKm) {
  if (!minPerKm) return null;
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

module.exports = router;
```

## Next Steps

1. Install required packages:

```bash
cd backend
npm install bcrypt jsonwebtoken pg dotenv helmet express-rate-limit express-validator stripe @anthropic-ai/sdk
# OR for OpenAI:
# npm install openai
```

2. Set up PostgreSQL database and run migration scripts

3. Set up Stripe account and get API keys

4. Set up Anthropic/OpenAI account and get API keys

5. Update `server.js` to use the new routes and middleware

6. Update frontend to use authentication context

7. Add subscription UI components

8. Test thoroughly before deploying

---

**Note**: This is a simplified guide. Production code should include:

- Better error handling
- Input validation
- Rate limiting
- Logging
- Testing
- Security best practices
- AI response caching
- Cost optimization
- Request queuing for AI calls
