// Database query helpers for user-specific data
const { query, getAll, getOne } = require("../config/database");

/**
 * Get activities for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Activities
 */
async function getActivitiesByUser(userId, options = {}) {
  const { type, startDate, endDate, limit } = options;

  let sql = `
    SELECT activity_data, start_time
    FROM activities
    WHERE user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  // Filter by activity type if specified
  if (type) {
    sql += ` AND activity_data->>'activityType'->>'typeKey' = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  // Filter by date range
  if (startDate) {
    sql += ` AND start_time >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND start_time <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  sql += ` ORDER BY start_time DESC`;

  if (limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
  }

  const result = await query(sql, params);

  return result.rows.map((row) => ({
    ...row.activity_data,
    startTimeGMT: row.start_time.toISOString(),
  }));
}

/**
 * Get running activities for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Running activities
 */
async function getRunningActivitiesByUser(userId, options = {}) {
  const activities = await getActivitiesByUser(userId, options);
  return activities.filter(
    (a) => a.activityType?.typeKey === "running"
  );
}

/**
 * Get daily summaries for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Daily summaries
 */
async function getDailySummariesByUser(userId, options = {}) {
  const { startDate, endDate, limit } = options;

  let sql = `
    SELECT summary_data, date
    FROM daily_summaries
    WHERE user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (startDate) {
    sql += ` AND date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  sql += ` ORDER BY date DESC`;

  if (limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
  }

  const result = await query(sql, params);

  return result.rows.map((row) => ({
    ...row.summary_data,
    calendarDate: row.date.toISOString().split("T")[0],
  }));
}

/**
 * Get most recent data date for a user
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Most recent date (YYYY-MM-DD) or null
 */
async function getMostRecentDateForUser(userId) {
  try {
    // Check activities
    const activityResult = await getOne(
      `SELECT MAX(start_time) as max_date
       FROM activities
       WHERE user_id = $1`,
      [userId]
    );

    // Check daily summaries
    const summaryResult = await getOne(
      `SELECT MAX(date) as max_date
       FROM daily_summaries
       WHERE user_id = $1`,
      [userId]
    );

    const activityDate = activityResult?.max_date
      ? activityResult.max_date.toISOString().split("T")[0]
      : null;
    const summaryDate = summaryResult?.max_date
      ? summaryResult.max_date.toISOString().split("T")[0]
      : null;

    if (!activityDate && !summaryDate) {
      return null;
    }

    if (!activityDate) return summaryDate;
    if (!summaryDate) return activityDate;

    return activityDate > summaryDate ? activityDate : summaryDate;
  } catch (error) {
    console.error("Error getting most recent date:", error);
    return null;
  }
}

/**
 * Get activity by ID for a specific user (with validation)
 * @param {string} userId - User ID
 * @param {string|number} activityId - Garmin activity ID
 * @returns {Promise<Object|null>} Activity data or null
 */
async function getActivityByUserAndId(userId, activityId) {
  const result = await getOne(
    `SELECT activity_data, start_time
     FROM activities
     WHERE user_id = $1 AND garmin_activity_id = $2`,
    [userId, activityId]
  );

  if (!result) {
    return null;
  }

  return {
    ...result.activity_data,
    startTimeGMT: result.start_time.toISOString(),
  };
}

module.exports = {
  getActivitiesByUser,
  getRunningActivitiesByUser,
  getDailySummariesByUser,
  getMostRecentDateForUser,
  getActivityByUserAndId,
};

