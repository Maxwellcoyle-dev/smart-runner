// Authentication middleware for JWT token verification
const jwt = require("jsonwebtoken");
const { getOne } = require("../config/database");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // Verify user still exists in database
      const user = await getOne("SELECT id, email, subscription_tier FROM users WHERE id = $1", [
        decoded.id,
      ]);

      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_tier,
      };

      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = { authenticateToken };

