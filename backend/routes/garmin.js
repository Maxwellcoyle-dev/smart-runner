// Garmin credential management routes
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { query, getOne } = require("../config/database");
const { encrypt, decrypt } = require("../utils/encryption");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const fs = require("fs-extra");
const path = require("path");
const router = express.Router();

/**
 * Test Garmin credentials by attempting to connect
 * This is a helper function that can be used to verify credentials
 */
async function testGarminConnection(email, password) {
  try {
    // Create a temporary config file for testing
    const tempDir = path.join(__dirname, "../temp_test");
    await fs.ensureDir(tempDir);

    const testConfig = {
      db: { type: "sqlite" },
      garmin: { domain: "garmin.com" },
      credentials: {
        user: email,
        secure_password: false,
        password: password,
        password_file: null,
      },
      data: {
        download_latest_activities: 1, // Just test with 1 activity
        download_all_activities: 1,
      },
      directories: {
        relative_to_home: false,
        base_dir: tempDir,
      },
      enabled_stats: {
        monitoring: false,
        steps: false,
        itime: false,
        sleep: false,
        rhr: false,
        weight: false,
        activities: true, // Only test activities
      },
    };

    const configPath = path.join(tempDir, "tokens", "GarminConnectConfig.json");
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(testConfig, null, 2));

    // Check if garmindb is available
    // In Docker/production: uses virtual environment at /opt/garmindb-venv
    const garmindbPython = process.env.GARMINDB_PYTHON || "/opt/garmindb-venv/bin/python";
    const garmindbCli = process.env.GARMINDB_CLI || "/opt/garmindb-venv/bin/garmindb_cli.py";
    
    // Check if Python exists (required)
    const pythonExists = await fs.pathExists(garmindbPython).catch(() => false);
    
    // Check if CLI exists (optional - we can use module approach)
    const cliExists = await fs.pathExists(garmindbCli).catch(() => false);
    
    if (!pythonExists) {
      // If garmindb isn't available, skip credential testing
      // Credentials will be tested on first sync
      await fs.remove(tempDir).catch(() => {});
      return {
        valid: true,
        message: "Credentials saved (will be verified on first sync)",
        warning: "garmindb not available for credential testing",
      };
    }

    // Try to run garmindb with test credentials
    const workDir = tempDir;
    // Try module approach first, fall back to CLI path
    let command;
    if (await fs.pathExists(garmindbCli)) {
      command = `cd "${workDir}" && "${garmindbPython}" "${garmindbCli}" -f "${path.dirname(configPath)}" -A -d --no-import --no-analyze 2>&1 | head -20`;
    } else {
      command = `cd "${workDir}" && "${garmindbPython}" -m garmindb -f "${path.dirname(configPath)}" -A -d --no-import --no-analyze 2>&1 | head -20`;
    }

    try {
      const result = await execAsync(command, {
        maxBuffer: 1024 * 1024, // 1MB
        timeout: 30000, // 30 second timeout
        cwd: workDir,
      });

      // Clean up temp directory
      await fs.remove(tempDir).catch(() => {});

      // If command succeeded (even partially), credentials are valid
      return { valid: true, message: "Credentials verified" };
    } catch (execError) {
      // Check if it's an authentication error
      const errorOutput = (execError.stderr || execError.stdout || "").toLowerCase();
      
      // Clean up temp directory
      await fs.remove(tempDir).catch(() => {});

      if (
        errorOutput.includes("login") ||
        errorOutput.includes("password") ||
        errorOutput.includes("authentication") ||
        errorOutput.includes("invalid credentials")
      ) {
        return {
          valid: false,
          message: "Invalid Garmin credentials",
        };
      }

      // Other errors (network, etc.) - assume credentials might be valid
      // but connection failed for other reasons
      return {
        valid: true,
        message: "Credentials appear valid (connection test had issues)",
        warning: execError.message,
      };
    }
  } catch (error) {
    console.error("Error testing Garmin connection:", error);
    // If we can't test, assume credentials are valid and let sync handle errors
    return {
      valid: true,
      message: "Could not verify credentials (will be tested on first sync)",
      warning: error.message,
    };
  }
}

/**
 * Connect/Store Garmin credentials
 * POST /api/garmin/connect
 */
router.post("/connect", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Test credentials (optional - can be slow, so we'll make it optional)
    const testCredentials = req.body.testCredentials !== false; // Default true
    let connectionTest = null;

    if (testCredentials) {
      connectionTest = await testGarminConnection(email, password);
      if (!connectionTest.valid) {
        return res.status(400).json({
          error: "Invalid Garmin credentials",
          message: connectionTest.message,
        });
      }
    }

    // Encrypt credentials
    const encryptedEmail = encrypt(email);
    const encryptedPassword = encrypt(password);

    // Check if credentials already exist
    const existing = await getOne(
      "SELECT id FROM garmin_credentials WHERE user_id = $1",
      [userId]
    );

    if (existing) {
      // Update existing credentials
      await query(
        `UPDATE garmin_credentials 
         SET encrypted_email = $1, 
             encrypted_password = $2,
             updated_at = NOW()
         WHERE user_id = $3`,
        [encryptedEmail, encryptedPassword, userId]
      );

      res.json({
        success: true,
        message: "Garmin credentials updated",
        connectionTest: connectionTest,
      });
    } else {
      // Insert new credentials
      await query(
        `INSERT INTO garmin_credentials (user_id, encrypted_email, encrypted_password)
         VALUES ($1, $2, $3)`,
        [userId, encryptedEmail, encryptedPassword]
      );

      res.json({
        success: true,
        message: "Garmin credentials connected",
        connectionTest: connectionTest,
      });
    }
  } catch (error) {
    console.error("Error storing Garmin credentials:", error);
    res.status(500).json({
      error: "Failed to store Garmin credentials",
      message: error.message,
    });
  }
});

/**
 * Get Garmin connection status
 * GET /api/garmin/status
 */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const creds = await getOne(
      `SELECT id, last_sync, created_at, updated_at 
       FROM garmin_credentials 
       WHERE user_id = $1`,
      [userId]
    );

    if (!creds) {
      return res.json({
        connected: false,
        message: "Garmin account not connected",
      });
    }

    res.json({
      connected: true,
      last_sync: creds.last_sync,
      connected_at: creds.created_at,
      updated_at: creds.updated_at,
    });
  } catch (error) {
    console.error("Error getting Garmin status:", error);
    res.status(500).json({
      error: "Failed to get Garmin status",
    });
  }
});

/**
 * Update Garmin credentials
 * PUT /api/garmin/connect
 */
router.put("/connect", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Check if credentials exist
    const existing = await getOne(
      "SELECT id FROM garmin_credentials WHERE user_id = $1",
      [userId]
    );

    if (!existing) {
      return res.status(404).json({
        error: "Garmin credentials not found",
        message: "Please connect your Garmin account first",
      });
    }

    // Test credentials
    const connectionTest = await testGarminConnection(email, password);
    if (!connectionTest.valid) {
      return res.status(400).json({
        error: "Invalid Garmin credentials",
        message: connectionTest.message,
      });
    }

    // Encrypt and update
    const encryptedEmail = encrypt(email);
    const encryptedPassword = encrypt(password);

    await query(
      `UPDATE garmin_credentials 
       SET encrypted_email = $1, 
           encrypted_password = $2,
           updated_at = NOW()
       WHERE user_id = $3`,
      [encryptedEmail, encryptedPassword, userId]
    );

    res.json({
      success: true,
      message: "Garmin credentials updated",
      connectionTest: connectionTest,
    });
  } catch (error) {
    console.error("Error updating Garmin credentials:", error);
    res.status(500).json({
      error: "Failed to update Garmin credentials",
      message: error.message,
    });
  }
});

/**
 * Delete/Disconnect Garmin credentials
 * DELETE /api/garmin/connect
 */
router.delete("/connect", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      "DELETE FROM garmin_credentials WHERE user_id = $1 RETURNING id",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Garmin credentials not found",
      });
    }

    // Optionally clean up user's data directory
    // (Keep for now, user might reconnect)

    res.json({
      success: true,
      message: "Garmin account disconnected",
    });
  } catch (error) {
    console.error("Error deleting Garmin credentials:", error);
    res.status(500).json({
      error: "Failed to disconnect Garmin account",
      message: error.message,
    });
  }
});

module.exports = router;

