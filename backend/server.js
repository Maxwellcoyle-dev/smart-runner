const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const sqlite3 = require("sqlite3").verbose();
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const DATA_DIR = path.join(__dirname, "../data");
const MONITORING_DIR = path.join(DATA_DIR, "FitFiles/Monitoring");
const ACTIVITIES_DIR = path.join(DATA_DIR, "FitFiles/Activities");
const DB_PATH = path.join(DATA_DIR, "DBs/garmin_monitoring.db");
const ACTIVITIES_DB_PATH = path.join(DATA_DIR, "DBs/garmin_activities.db");
const SYNC_STATE_FILE = path.join(__dirname, ".sync_state.json");
const GARMINDB_PYTHON =
  "/Users/maxwell-coyle/.local/pipx/venvs/garmindb/bin/python";
const GARMINDB_CLI = "/Users/maxwell-coyle/.local/bin/garmindb_cli.py";

// Database connections
let db = null;
let activitiesDb = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database");
      }
    });
  }
  return db;
}

function getActivitiesDb() {
  if (!activitiesDb) {
    activitiesDb = new sqlite3.Database(ACTIVITIES_DB_PATH, (err) => {
      if (err) {
        console.error("Error opening activities database:", err.message);
      } else {
        console.log("Connected to activities SQLite database");
      }
    });
  }
  return activitiesDb;
}

// Helper function to read JSON files
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Helper function to get all daily summary files
async function getAllDailySummaries() {
  const summaries = [];
  const years = await fs.readdir(MONITORING_DIR);

  for (const year of years) {
    const yearPath = path.join(MONITORING_DIR, year);
    const stat = await fs.stat(yearPath);

    if (stat.isDirectory()) {
      const files = await fs.readdir(yearPath);
      const dailySummaryFiles = files.filter((f) =>
        f.startsWith("daily_summary_")
      );

      for (const file of dailySummaryFiles) {
        const filePath = path.join(yearPath, file);
        const data = await readJsonFile(filePath);
        if (data) {
          summaries.push(data);
        }
      }
    }
  }

  return summaries.sort(
    (a, b) => new Date(a.calendarDate) - new Date(b.calendarDate)
  );
}

// Helper function to get all activity files
async function getAllActivities() {
  const activities = [];
  const files = await fs.readdir(ACTIVITIES_DIR);
  const activityFiles = files.filter(
    (f) =>
      f.startsWith("activity_") &&
      f.endsWith(".json") &&
      !f.includes("_details_")
  );

  for (const file of activityFiles) {
    const filePath = path.join(ACTIVITIES_DIR, file);
    const data = await readJsonFile(filePath);
    if (data) {
      activities.push(data);
    }
  }

  return activities.sort(
    (a, b) => new Date(a.startTimeGMT) - new Date(b.startTimeGMT)
  );
}

// Helper function to get the most recent date from data
async function getMostRecentDate() {
  try {
    // Get most recent daily summary date
    let mostRecentDate = null;
    const summaries = await getAllDailySummaries();
    if (summaries.length > 0) {
      const dates = summaries
        .map((s) => s.calendarDate)
        .filter((d) => d)
        .sort()
        .reverse();
      if (dates.length > 0) {
        mostRecentDate = dates[0];
      }
    }

    // Also check activities for most recent date
    const activities = await getAllActivities();
    if (activities.length > 0) {
      const activityDates = activities
        .map((a) => {
          if (a.startTimeGMT) {
            return a.startTimeGMT.split(" ")[0]; // Extract date part
          }
          return null;
        })
        .filter((d) => d)
        .sort()
        .reverse();
      if (activityDates.length > 0) {
        const activityDate = activityDates[0];
        if (!mostRecentDate || activityDate > mostRecentDate) {
          mostRecentDate = activityDate;
        }
      }
    }

    return mostRecentDate;
  } catch (error) {
    console.error("Error getting most recent date:", error);
    return null;
  }
}

// Helper function to load sync state
async function loadSyncState() {
  try {
    if (await fs.pathExists(SYNC_STATE_FILE)) {
      const data = await fs.readFile(SYNC_STATE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading sync state:", error);
  }
  return { lastSyncDate: null, lastSyncTime: null };
}

// Helper function to save sync state
async function saveSyncState(syncState) {
  try {
    await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(syncState, null, 2));
  } catch (error) {
    console.error("Error saving sync state:", error);
  }
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Garmin API is running" });
});

// Get daily summaries with optional date range
app.get("/api/daily-summaries", async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    let summaries = await getAllDailySummaries();

    // Filter by date range
    if (startDate) {
      summaries = summaries.filter((s) => s.calendarDate >= startDate);
    }
    if (endDate) {
      summaries = summaries.filter((s) => s.calendarDate <= endDate);
    }

    // Limit results
    if (limit) {
      summaries = summaries.slice(-parseInt(limit));
    }

    res.json({
      count: summaries.length,
      data: summaries,
    });
  } catch (error) {
    console.error("Error fetching daily summaries:", error);
    res.status(500).json({ error: "Failed to fetch daily summaries" });
  }
});

// Get aggregated daily summary stats
app.get("/api/daily-summaries/aggregated", async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    let summaries = await getAllDailySummaries();

    // Filter by date range
    if (startDate) {
      summaries = summaries.filter((s) => s.calendarDate >= startDate);
    }
    if (endDate) {
      summaries = summaries.filter((s) => s.calendarDate <= endDate);
    }

    // Aggregate based on groupBy parameter
    const groupByParam = groupBy || "day";

    if (groupByParam === "week") {
      // Group by week
      const weekly = {};
      summaries.forEach((summary) => {
        const date = new Date(summary.calendarDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weekly[weekKey]) {
          weekly[weekKey] = {
            weekStart: weekKey,
            totalSteps: 0,
            totalDistance: 0,
            totalCalories: 0,
            avgRestingHeartRate: [],
            avgStressLevel: [],
            avgBodyBattery: [],
            days: 0,
          };
        }

        weekly[weekKey].totalSteps += summary.totalSteps || 0;
        weekly[weekKey].totalDistance +=
          (summary.totalDistanceMeters || 0) / 1000; // Convert to km
        weekly[weekKey].totalCalories += summary.totalKilocalories || 0;
        if (summary.restingHeartRate)
          weekly[weekKey].avgRestingHeartRate.push(summary.restingHeartRate);
        if (summary.averageStressLevel)
          weekly[weekKey].avgStressLevel.push(summary.averageStressLevel);
        if (summary.bodyBatteryHighestValue)
          weekly[weekKey].avgBodyBattery.push(summary.bodyBatteryHighestValue);
        weekly[weekKey].days++;
      });

      // Calculate averages
      Object.keys(weekly).forEach((key) => {
        const week = weekly[key];
        week.avgRestingHeartRate =
          week.avgRestingHeartRate.length > 0
            ? week.avgRestingHeartRate.reduce((a, b) => a + b, 0) /
              week.avgRestingHeartRate.length
            : null;
        week.avgStressLevel =
          week.avgStressLevel.length > 0
            ? week.avgStressLevel.reduce((a, b) => a + b, 0) /
              week.avgStressLevel.length
            : null;
        week.avgBodyBattery =
          week.avgBodyBattery.length > 0
            ? week.avgBodyBattery.reduce((a, b) => a + b, 0) /
              week.avgBodyBattery.length
            : null;
      });

      res.json({
        groupBy: "week",
        count: Object.keys(weekly).length,
        data: Object.values(weekly),
      });
    } else if (groupByParam === "month") {
      // Group by month
      const monthly = {};
      summaries.forEach((summary) => {
        const date = new Date(summary.calendarDate);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthly[monthKey]) {
          monthly[monthKey] = {
            month: monthKey,
            totalSteps: 0,
            totalDistance: 0,
            totalCalories: 0,
            avgRestingHeartRate: [],
            avgStressLevel: [],
            avgBodyBattery: [],
            days: 0,
          };
        }

        monthly[monthKey].totalSteps += summary.totalSteps || 0;
        monthly[monthKey].totalDistance +=
          (summary.totalDistanceMeters || 0) / 1000;
        monthly[monthKey].totalCalories += summary.totalKilocalories || 0;
        if (summary.restingHeartRate)
          monthly[monthKey].avgRestingHeartRate.push(summary.restingHeartRate);
        if (summary.averageStressLevel)
          monthly[monthKey].avgStressLevel.push(summary.averageStressLevel);
        if (summary.bodyBatteryHighestValue)
          monthly[monthKey].avgBodyBattery.push(
            summary.bodyBatteryHighestValue
          );
        monthly[monthKey].days++;
      });

      // Calculate averages
      Object.keys(monthly).forEach((key) => {
        const month = monthly[key];
        month.avgRestingHeartRate =
          month.avgRestingHeartRate.length > 0
            ? month.avgRestingHeartRate.reduce((a, b) => a + b, 0) /
              month.avgRestingHeartRate.length
            : null;
        month.avgStressLevel =
          month.avgStressLevel.length > 0
            ? month.avgStressLevel.reduce((a, b) => a + b, 0) /
              month.avgStressLevel.length
            : null;
        month.avgBodyBattery =
          month.avgBodyBattery.length > 0
            ? month.avgBodyBattery.reduce((a, b) => a + b, 0) /
              month.avgBodyBattery.length
            : null;
      });

      res.json({
        groupBy: "month",
        count: Object.keys(monthly).length,
        data: Object.values(monthly),
      });
    } else {
      // Overall aggregation
      const aggregated = {
        totalDays: summaries.length,
        totalSteps: summaries.reduce((sum, s) => sum + (s.totalSteps || 0), 0),
        totalDistance:
          summaries.reduce((sum, s) => sum + (s.totalDistanceMeters || 0), 0) /
          1000, // km
        totalCalories: summaries.reduce(
          (sum, s) => sum + (s.totalKilocalories || 0),
          0
        ),
        avgSteps: 0,
        avgDistance: 0,
        avgCalories: 0,
        avgRestingHeartRate: 0,
        avgStressLevel: 0,
        avgBodyBattery: 0,
      };

      const restingHR = summaries
        .filter((s) => s.restingHeartRate)
        .map((s) => s.restingHeartRate);
      const stressLevels = summaries
        .filter((s) => s.averageStressLevel)
        .map((s) => s.averageStressLevel);
      const bodyBattery = summaries
        .filter((s) => s.bodyBatteryHighestValue)
        .map((s) => s.bodyBatteryHighestValue);

      aggregated.avgSteps = aggregated.totalSteps / aggregated.totalDays;
      aggregated.avgDistance = aggregated.totalDistance / aggregated.totalDays;
      aggregated.avgCalories = aggregated.totalCalories / aggregated.totalDays;
      aggregated.avgRestingHeartRate =
        restingHR.length > 0
          ? restingHR.reduce((a, b) => a + b, 0) / restingHR.length
          : null;
      aggregated.avgStressLevel =
        stressLevels.length > 0
          ? stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length
          : null;
      aggregated.avgBodyBattery =
        bodyBattery.length > 0
          ? bodyBattery.reduce((a, b) => a + b, 0) / bodyBattery.length
          : null;

      res.json({
        groupBy: "overall",
        data: aggregated,
      });
    }
  } catch (error) {
    console.error("Error aggregating daily summaries:", error);
    res.status(500).json({ error: "Failed to aggregate daily summaries" });
  }
});

// Get activities
app.get("/api/activities", async (req, res) => {
  try {
    const { type, startDate, endDate, limit } = req.query;
    let activities = await getAllActivities();

    // Filter by activity type
    if (type) {
      activities = activities.filter(
        (a) =>
          a.activityType?.typeKey === type ||
          a.activityType?.typeId === parseInt(type)
      );
    }

    // Filter by date range
    if (startDate) {
      activities = activities.filter((a) => a.startTimeGMT >= startDate);
    }
    if (endDate) {
      activities = activities.filter((a) => a.startTimeGMT <= endDate);
    }

    // Limit results
    if (limit) {
      activities = activities.slice(-parseInt(limit));
    }

    res.json({
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Helper function to query database with SQL
function queryDb(sql, params = [], useActivitiesDb = false) {
  return new Promise((resolve, reject) => {
    const database = useActivitiesDb ? getActivitiesDb() : getDb();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Get running activities with detailed stats
app.get("/api/running", async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    // Use JSON files for now (database has different schema)
    let activities = await getAllActivities();
    let runningActivities = activities.filter(
      (a) => a.activityType?.typeKey === "running"
    );

    if (startDate) {
      runningActivities = runningActivities.filter(
        (a) => a.startTimeGMT >= startDate
      );
    }
    if (endDate) {
      runningActivities = runningActivities.filter(
        (a) => a.startTimeGMT <= endDate
      );
    }

    runningActivities.sort(
      (a, b) => new Date(b.startTimeGMT) - new Date(a.startTimeGMT)
    );

    if (limit) {
      runningActivities = runningActivities.slice(0, parseInt(limit));
    }

    res.json({
      count: runningActivities.length,
      data: runningActivities,
    });
  } catch (error) {
    console.error("Error fetching running activities:", error);
    res.status(500).json({ error: "Failed to fetch running activities" });
  }
});

// Get splits for a specific activity (must come before /api/activities/:id route)
app.get("/api/activities/:id/splits", async (req, res) => {
  try {
    const { id } = req.params;
    const { unit } = req.query; // 'km' or 'miles'

    // Query splits from database first
    const sql = `
      SELECT 
        split,
        distance,
        elapsed_time,
        moving_time,
        avg_speed,
        max_speed,
        avg_hr,
        max_hr,
        avg_cadence,
        max_cadence,
        ascent,
        descent
      FROM activity_splits
      WHERE activity_id = ?
      ORDER BY split
    `;

    let splits = await queryDb(sql, [id], true);

    // If no splits in database, extract from FIT file
    if (splits.length === 0) {
      const splitDistance = unit === "miles" ? 1609.34 : 1000; // meters

      // Find the FIT file for this activity
      const fitFileName = `${id}_ACTIVITY.fit`;
      const fitFilePath = path.join(ACTIVITIES_DIR, fitFileName);

      if (await fs.pathExists(fitFilePath)) {
        // Use Python script to extract splits from FIT file
        const scriptPath = path.join(__dirname, "extract_splits.py");
        const command = `"${GARMINDB_PYTHON}" "${scriptPath}" "${fitFilePath}" ${splitDistance}`;

        try {
          const result = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 30000, // 30 second timeout
            cwd: __dirname,
          });

          const output = result.stdout || "";
          if (!output || output.trim() === "") {
            console.error("Python script returned empty output");
          } else {
            try {
              const splitData = JSON.parse(output);
              if (splitData.splits && splitData.splits.length > 0) {
                splits = splitData.splits;
                console.log(
                  `Extracted ${splits.length} splits from FIT file for activity ${id}`
                );
              } else if (splitData.error) {
                console.error("Python script error:", splitData.error);
              }
            } catch (parseError) {
              console.error(
                "Failed to parse Python script output:",
                parseError.message,
                output.substring(0, 200)
              );
            }
          }
        } catch (execError) {
          console.error(
            "Error extracting splits from FIT file:",
            execError.message,
            execError.stdout,
            execError.stderr
          );
          // Fall back to calculating from activity_records if FIT extraction fails
        }
      }
    }

    if (splits.length === 0) {
      return res
        .status(404)
        .json({ error: "No splits found for this activity" });
    }

    res.json({
      activityId: id,
      count: splits.length,
      unit: unit || "km",
      data: splits,
    });
  } catch (error) {
    console.error("Error fetching splits:", error);
    res.status(500).json({ error: "Failed to fetch splits" });
  }
});

// Get aggregated running stats
app.get("/api/running/stats", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let activities = await getAllActivities();

    // Filter to only running activities
    let runningActivities = activities.filter(
      (a) => a.activityType?.typeKey === "running"
    );

    // Filter by date range
    if (startDate) {
      runningActivities = runningActivities.filter(
        (a) => a.startTimeGMT >= startDate
      );
    }
    if (endDate) {
      runningActivities = runningActivities.filter(
        (a) => a.startTimeGMT <= endDate
      );
    }

    if (runningActivities.length === 0) {
      return res.json({
        totalRuns: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        avgDistance: 0,
        avgPace: null,
        avgHeartRate: null,
        avgCadence: null,
        totalElevationGain: 0,
      });
    }

    // Calculate stats
    const totalDistance = runningActivities.reduce(
      (sum, a) => sum + (a.distance || 0),
      0
    );
    const totalDuration = runningActivities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0
    );
    const totalCalories = runningActivities.reduce(
      (sum, a) => sum + (a.calories || 0),
      0
    );
    const totalElevationGain = runningActivities.reduce(
      (sum, a) => sum + (a.elevationGain || 0),
      0
    );

    // Calculate averages
    const avgDistance = totalDistance / runningActivities.length;
    const avgDuration = totalDuration / runningActivities.length;

    // Calculate average pace (minutes per km)
    // averageSpeed is in m/s, so pace = 1000 / (speed * 60) = 1000 / speed / 60
    const speeds = runningActivities
      .filter((a) => a.averageSpeed && a.averageSpeed > 0)
      .map((a) => a.averageSpeed);
    const avgPace =
      speeds.length > 0
        ? 1000 / (speeds.reduce((a, b) => a + b, 0) / speeds.length) / 60
        : null;

    // Average heart rate
    const heartRates = runningActivities
      .filter((a) => a.averageHR)
      .map((a) => a.averageHR);
    const avgHeartRate =
      heartRates.length > 0
        ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
        : null;

    // Average cadence
    const cadences = runningActivities
      .filter((a) => a.averageRunningCadenceInStepsPerMinute)
      .map((a) => a.averageRunningCadenceInStepsPerMinute);
    const avgCadence =
      cadences.length > 0
        ? cadences.reduce((a, b) => a + b, 0) / cadences.length
        : null;

    res.json({
      totalRuns: runningActivities.length,
      totalDistance: totalDistance / 1000, // Convert to km
      totalDuration: totalDuration, // seconds
      totalCalories: totalCalories,
      avgDistance: avgDistance / 1000, // km
      avgDuration: avgDuration, // seconds
      avgPace: avgPace, // minutes per km
      avgHeartRate: avgHeartRate,
      avgCadence: avgCadence,
      totalElevationGain: totalElevationGain, // meters
      bestPace:
        speeds.length > 0
          ? Math.min(...speeds.map((s) => 1000 / s / 60))
          : null,
      longestRun: Math.max(
        ...runningActivities.map((a) => (a.distance || 0) / 1000)
      ),
    });
  } catch (error) {
    console.error("Error aggregating running stats:", error);
    res.status(500).json({ error: "Failed to aggregate running stats" });
  }
});

// Get aggregated activity stats
app.get("/api/activities/aggregated", async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let activities = await getAllActivities();

    // Filter by activity type
    if (type) {
      activities = activities.filter(
        (a) =>
          a.activityType?.typeKey === type ||
          a.activityType?.typeId === parseInt(type)
      );
    }

    // Filter by date range
    if (startDate) {
      activities = activities.filter((a) => a.startTimeGMT >= startDate);
    }
    if (endDate) {
      activities = activities.filter((a) => a.startTimeGMT <= endDate);
    }

    // Aggregate stats
    const aggregated = {
      totalActivities: activities.length,
      totalDistance:
        activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000, // km
      totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0), // seconds
      totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
      totalElevationGain: activities.reduce(
        (sum, a) => sum + (a.elevationGain || 0),
        0
      ),
      avgDistance: 0,
      avgDuration: 0,
      avgCalories: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      activitiesByType: {},
    };

    const heartRates = activities
      .filter((a) => a.averageHR)
      .map((a) => a.averageHR);
    const maxHeartRates = activities.filter((a) => a.maxHR).map((a) => a.maxHR);

    aggregated.avgDistance =
      aggregated.totalDistance / aggregated.totalActivities;
    aggregated.avgDuration =
      aggregated.totalDuration / aggregated.totalActivities;
    aggregated.avgCalories =
      aggregated.totalCalories / aggregated.totalActivities;
    aggregated.avgHeartRate =
      heartRates.length > 0
        ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
        : null;
    aggregated.maxHeartRate =
      maxHeartRates.length > 0 ? Math.max(...maxHeartRates) : null;

    // Group by activity type
    activities.forEach((activity) => {
      const typeKey = activity.activityType?.typeKey || "unknown";
      if (!aggregated.activitiesByType[typeKey]) {
        aggregated.activitiesByType[typeKey] = {
          count: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalCalories: 0,
        };
      }
      aggregated.activitiesByType[typeKey].count++;
      aggregated.activitiesByType[typeKey].totalDistance +=
        (activity.distance || 0) / 1000;
      aggregated.activitiesByType[typeKey].totalDuration +=
        activity.duration || 0;
      aggregated.activitiesByType[typeKey].totalCalories +=
        activity.calories || 0;
    });

    res.json(aggregated);
  } catch (error) {
    console.error("Error aggregating activities:", error);
    res.status(500).json({ error: "Failed to aggregate activities" });
  }
});

// Get activity details with splits (MUST come before /api/activities/:id route)
app.get("/api/activities/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const detailFilePath = path.join(
      ACTIVITIES_DIR,
      `activity_details_${id}.json`
    );
    const detailData = await readJsonFile(detailFilePath);

    if (!detailData) {
      return res.status(404).json({ error: "Activity details not found" });
    }

    res.json(detailData);
  } catch (error) {
    console.error("Error fetching activity details:", error);
    res.status(500).json({ error: "Failed to fetch activity details" });
  }
});

// Sync data from Garmin Connect
app.post("/api/sync", async (req, res) => {
  try {
    // Load last sync state
    const syncState = await loadSyncState();
    let lastSyncDate = syncState.lastSyncDate;

    // If no last sync date, get the most recent date from existing data
    if (!lastSyncDate) {
      lastSyncDate = await getMostRecentDate();
      console.log(
        `No previous sync found. Most recent data date: ${lastSyncDate}`
      );
    } else {
      console.log(`Last sync date: ${lastSyncDate}`);
    }

    // Build garmindb command
    // Note: garmindb_cli doesn't have a direct "sync since date" option,
    // but it skips files that already exist, so we can just run it
    // and it will only download new data
    // Use the Python from the pipx virtual environment
    const workDir = path.join(__dirname, "..");
    const configDir = path.join(workDir, "data/tokens");
    // Use -A for all stats, -d for download, -i for import, --analyze for analysis
    // Use -f to specify the config directory (garmindb looks for GarminConnectConfig.json in that dir)
    const command = `cd "${workDir}" && "${GARMINDB_PYTHON}" "${GARMINDB_CLI}" -f "${configDir}" -A -d -i --analyze`;

    console.log("Starting Garmin data sync...");
    const startTime = Date.now();

    // Execute garmindb sync
    let stdout = "";
    let stderr = "";
    try {
      const result = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 300000, // 5 minute timeout
        cwd: workDir,
      });
      stdout = result.stdout || "";
      stderr = result.stderr || "";
    } catch (execError) {
      // Capture stderr from the command execution
      stdout = execError.stdout || "";
      stderr = execError.stderr || "";

      // Check if we got any useful output (partial success)
      const hasOutput = stdout.length > 0 || stderr.length > 0;
      const exitCode = execError.code || 1;

      // If we got output but the command failed, it might be a partial success
      // (e.g., activities downloaded but monitoring failed)
      if (hasOutput && stdout.includes("activities") && exitCode !== 0) {
        console.warn(
          "Sync completed with warnings (partial success):",
          stderr.substring(0, 200)
        );
        // Continue as partial success - some data was synced
      } else if (exitCode && exitCode !== 0) {
        throw new Error(
          `Garmin sync command failed (exit code ${exitCode}): ${
            stderr || execError.message
          }\n` +
            `Command: ${command}\n` +
            `Stdout: ${stdout.substring(0, 500)}\n` +
            `Stderr: ${stderr.substring(0, 500)}`
        );
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Get the new most recent date after sync
    const newMostRecentDate = await getMostRecentDate();

    // Update sync state
    const newSyncState = {
      lastSyncDate: newMostRecentDate || lastSyncDate,
      lastSyncTime: new Date().toISOString(),
      duration: duration,
    };
    await saveSyncState(newSyncState);

    console.log(`Sync completed in ${duration} seconds`);
    console.log(`New most recent date: ${newMostRecentDate}`);

    res.json({
      success: true,
      message: "Sync completed successfully",
      lastSyncDate: newSyncState.lastSyncDate,
      lastSyncTime: newSyncState.lastSyncTime,
      duration: duration,
      stdout: stdout.substring(0, 500), // First 500 chars of output
      stderr: stderr ? stderr.substring(0, 500) : null,
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      error: "Failed to sync data",
      message: error.message,
      details: error.stack,
    });
  }
});

// Get sync status
app.get("/api/sync/status", async (req, res) => {
  try {
    const syncState = await loadSyncState();
    const mostRecentDate = await getMostRecentDate();

    res.json({
      lastSyncDate: syncState.lastSyncDate,
      lastSyncTime: syncState.lastSyncTime,
      mostRecentDataDate: mostRecentDate,
      needsSync: syncState.lastSyncDate !== mostRecentDate,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    res.status(500).json({ error: "Failed to get sync status" });
  }
});

// Get health metrics (steps, heart rate, stress, etc.)
app.get("/api/health-metrics", async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.query;
    let summaries = await getAllDailySummaries();

    // Filter by date range
    if (startDate) {
      summaries = summaries.filter((s) => s.calendarDate >= startDate);
    }
    if (endDate) {
      summaries = summaries.filter((s) => s.calendarDate <= endDate);
    }

    // Extract specific metric if requested
    if (metric) {
      const metricData = summaries
        .map((s) => ({
          date: s.calendarDate,
          value: s[metric] || null,
        }))
        .filter((m) => m.value !== null);

      return res.json({
        metric,
        count: metricData.length,
        data: metricData,
      });
    }

    // Return all health metrics
    const metrics = summaries.map((s) => ({
      date: s.calendarDate,
      steps: s.totalSteps || null,
      restingHeartRate: s.restingHeartRate || null,
      averageStressLevel: s.averageStressLevel || null,
      bodyBatteryHighest: s.bodyBatteryHighestValue || null,
      bodyBatteryLowest: s.bodyBatteryLowestValue || null,
      averageSpo2: s.averageSpo2 || null,
      avgWakingRespiration: s.avgWakingRespirationValue || null,
      activeCalories: s.activeKilocalories || null,
      totalCalories: s.totalKilocalories || null,
    }));

    res.json({
      count: metrics.length,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    res.status(500).json({ error: "Failed to fetch health metrics" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Garmin API server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
