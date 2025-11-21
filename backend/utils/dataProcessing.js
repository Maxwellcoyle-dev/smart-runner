// Utilities for processing and storing synced Garmin data in the database
const fs = require("fs-extra");
const path = require("path");
const { query } = require("../config/database");

/**
 * Process synced activities and store in database
 * @param {string} userId - User ID
 * @param {string} dataDir - User's data directory
 * @returns {Promise<Object>} Processing results
 */
async function processSyncedActivities(userId, dataDir) {
  try {
    const activitiesDir = path.join(dataDir, "FitFiles", "Activities");

    // Check if directory exists
    if (!(await fs.pathExists(activitiesDir))) {
      console.log(`Activities directory not found: ${activitiesDir}`);
      return { processed: 0, errors: 0 };
    }

    const files = await fs.readdir(activitiesDir);
    const activityFiles = files.filter(
      (f) =>
        f.startsWith("activity_") &&
        f.endsWith(".json") &&
        !f.includes("_details_")
    );

    let processed = 0;
    let errors = 0;

    for (const file of activityFiles) {
      try {
        const filePath = path.join(activitiesDir, file);
        const activityData = await fs.readJson(filePath);

        if (!activityData || !activityData.activityId) {
          console.warn(`Skipping activity file without activityId: ${file}`);
          continue;
        }

        const activityId = activityData.activityId;
        const startTime = activityData.startTimeGMT
          ? new Date(activityData.startTimeGMT)
          : null;

        if (!startTime || isNaN(startTime.getTime())) {
          console.warn(
            `Skipping activity ${activityId} with invalid startTime`
          );
          continue;
        }

        // Insert or update activity in database
        await query(
          `INSERT INTO activities (user_id, garmin_activity_id, activity_data, start_time)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, garmin_activity_id)
           DO UPDATE SET activity_data = $3, start_time = $4`,
          [userId, activityId, JSON.stringify(activityData), startTime]
        );

        processed++;
      } catch (error) {
        console.error(`Error processing activity file ${file}:`, error.message);
        errors++;
      }
    }

    console.log(
      `Processed ${processed} activities for user ${userId} (${errors} errors)`
    );
    return { processed, errors };
  } catch (error) {
    console.error("Error processing activities:", error);
    throw error;
  }
}

/**
 * Process synced daily summaries and store in database
 * @param {string} userId - User ID
 * @param {string} dataDir - User's data directory
 * @returns {Promise<Object>} Processing results
 */
async function processSyncedDailySummaries(userId, dataDir) {
  try {
    const monitoringDir = path.join(dataDir, "FitFiles", "Monitoring");

    if (!(await fs.pathExists(monitoringDir))) {
      console.log(`Monitoring directory not found: ${monitoringDir}`);
      return { processed: 0, errors: 0 };
    }

    const summaries = [];
    const years = await fs.readdir(monitoringDir);

    for (const year of years) {
      const yearPath = path.join(monitoringDir, year);
      const stat = await fs.stat(yearPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(yearPath);
        const dailySummaryFiles = files.filter((f) =>
          f.startsWith("daily_summary_")
        );

        for (const file of dailySummaryFiles) {
          try {
            const filePath = path.join(yearPath, file);
            const data = await fs.readJson(filePath);
            if (data && data.calendarDate) {
              summaries.push(data);
            }
          } catch (error) {
            console.error(`Error reading summary file ${file}:`, error.message);
          }
        }
      }
    }

    let processed = 0;
    let errors = 0;

    for (const summary of summaries) {
      try {
        if (!summary.calendarDate) {
          continue;
        }

        const date = new Date(summary.calendarDate);
        if (isNaN(date.getTime())) {
          continue;
        }

        // Insert or update daily summary
        await query(
          `INSERT INTO daily_summaries (user_id, date, summary_data)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, date)
           DO UPDATE SET summary_data = $3`,
          [userId, date, JSON.stringify(summary)]
        );

        processed++;
      } catch (error) {
        console.error(
          `Error processing daily summary ${summary.calendarDate}:`,
          error.message
        );
        errors++;
      }
    }

    console.log(
      `Processed ${processed} daily summaries for user ${userId} (${errors} errors)`
    );
    return { processed, errors };
  } catch (error) {
    console.error("Error processing daily summaries:", error);
    throw error;
  }
}

/**
 * Process all synced data for a user
 * @param {string} userId - User ID
 * @param {string} dataDir - User's data directory
 * @returns {Promise<Object>} Processing results
 */
async function processSyncedData(userId, dataDir) {
  try {
    const activitiesResult = await processSyncedActivities(userId, dataDir);
    const summariesResult = await processSyncedDailySummaries(userId, dataDir);

    return {
      activities: activitiesResult,
      summaries: summariesResult,
      totalProcessed: activitiesResult.processed + summariesResult.processed,
      totalErrors: activitiesResult.errors + summariesResult.errors,
    };
  } catch (error) {
    console.error("Error processing synced data:", error);
    throw error;
  }
}

module.exports = {
  processSyncedActivities,
  processSyncedDailySummaries,
  processSyncedData,
};
