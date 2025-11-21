// Authentication routes: register, login, logout, Google OAuth
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { query, getOne } = require("../config/database");
const router = express.Router();

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${
          process.env.BACKEND_URL ||
          (process.env.FRONTEND_URL
            ? process.env.FRONTEND_URL.replace(":3001", ":3000").replace(
                "3001",
                "3000"
              )
            : "http://localhost:3000")
        }/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          const displayName = profile.displayName;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          // Check if user exists with this Google ID
          let user = await getOne(
            "SELECT id, email, google_id, subscription_tier FROM users WHERE google_id = $1",
            [googleId]
          );

          if (user) {
            // User exists with Google ID, return user
            return done(null, user);
          }

          // Check if user exists with this email (might have signed up with email/password)
          user = await getOne(
            "SELECT id, email, google_id, subscription_tier FROM users WHERE email = $1",
            [email]
          );

          if (user) {
            // User exists but doesn't have Google ID linked, link it
            await query("UPDATE users SET google_id = $1 WHERE id = $2", [
              googleId,
              user.id,
            ]);
            user.google_id = googleId;
            return done(null, user);
          }

          // New user, create account
          const result = await query(
            "INSERT INTO users (email, google_id, password_hash) VALUES ($1, $2, NULL) RETURNING id, email, google_id, subscription_tier",
            [email, googleId]
          );

          user = result.rows[0];
          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session (we're using JWT, so this is minimal)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getOne(
        "SELECT id, email, google_id, subscription_tier FROM users WHERE id = $1",
        [id]
      );
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

// Register new user
router.post("/register", async (req, res) => {
  try {
    // Validate JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set!");
      return res.status(500).json({
        error: "Server configuration error",
        message: "JWT_SECRET not configured",
      });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await getOne("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email.toLowerCase().trim(), passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscription_tier: "free",
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Registration failed",
      message: error.message,
      // Only include details in development
      ...(process.env.NODE_ENV === "development" && { details: error.stack }),
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    // Validate JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set!");
      return res.status(500).json({
        error: "Server configuration error",
        message: "JWT_SECRET not configured",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const user = await getOne(
      "SELECT id, email, password_hash, google_id, subscription_tier FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user signed up with Google (no password)
    if (!user.password_hash) {
      return res.status(401).json({
        error: "Invalid credentials",
        message:
          "This account was created with Google. Please sign in with Google.",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_tier,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Login failed",
      message: error.message,
      // Only include details in development
      ...(process.env.NODE_ENV === "development" && { details: error.stack }),
    });
  }
});

// Get current user (verify token)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      const user = await getOne(
        "SELECT id, email, subscription_tier, subscription_status FROM users WHERE id = $1",
        [decoded.id]
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
        },
      });
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post("/logout", async (req, res) => {
  // Since we're using JWT, logout is primarily client-side
  // In a more advanced setup, you could maintain a token blacklist
  res.json({ success: true, message: "Logged out successfully" });
});

// Google OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth flow
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  // Google OAuth callback
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/api/auth/google/failure",
    }),
    async (req, res) => {
      try {
        if (!req.user) {
          console.error("Google OAuth callback: No user in request");
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3001";
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }

        // Validate JWT_SECRET is set
        if (!process.env.JWT_SECRET) {
          console.error("JWT_SECRET is not set in Google OAuth callback!");
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3001";
          return res.redirect(`${frontendUrl}/login?error=server_config_error`);
        }

        // Validate user has required fields
        if (!req.user.id || !req.user.email) {
          console.error(
            "Google OAuth callback: User missing required fields",
            req.user
          );
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3001";
          return res.redirect(`${frontendUrl}/login?error=user_data_invalid`);
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: req.user.id, email: req.user.email },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
        console.log(
          `Google OAuth success: Redirecting to ${frontendUrl}/auth/callback`
        );
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        console.error("Error stack:", error.stack);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
        res.redirect(
          `${frontendUrl}/login?error=google_auth_failed&message=${encodeURIComponent(
            error.message
          )}`
        );
      }
    }
  );

  // Failure route for Google OAuth
  router.get("/google/failure", (req, res) => {
    console.error("Google OAuth failure route hit");
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  });
} else {
  // If Google OAuth is not configured, return error
  router.get("/google", (req, res) => {
    res.status(503).json({
      error: "Google OAuth not configured",
      message: "Google sign-in is not available. Please contact support.",
    });
  });

  router.get("/google/callback", (req, res) => {
    res.status(503).json({
      error: "Google OAuth not configured",
      message: "Google sign-in is not available. Please contact support.",
    });
  });
}

module.exports = router;
