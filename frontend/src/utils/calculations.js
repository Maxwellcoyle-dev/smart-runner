import { getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from "./dateUtils";

/**
 * Get activities for a specific period
 * @param {Array} activities - All activities
 * @param {Date} selectedDate - Selected date
 * @param {string} viewMode - 'week' or 'month'
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Array} Filtered activities for the period
 */
export const getPeriodActivities = (
  activities,
  selectedDate,
  viewMode,
  weekStartDay = 0
) => {
  // Validate selectedDate first
  if (!selectedDate || isNaN(selectedDate.getTime())) {
    console.warn(
      "Invalid selectedDate in getPeriodActivities, using current date"
    );
    return [];
  }

  let startDate, endDate;
  try {
    if (viewMode === "month") {
      startDate = getMonthStart(selectedDate);
      endDate = getMonthEnd(selectedDate);
    } else {
      startDate = getWeekStart(selectedDate, weekStartDay);
      endDate = getWeekEnd(selectedDate, weekStartDay);
    }

    // Validate calculated dates
    if (
      !startDate ||
      !endDate ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      console.warn("Invalid startDate or endDate in getPeriodActivities");
      return [];
    }
  } catch (error) {
    console.error("Error calculating period dates:", error);
    return [];
  }

  return activities.filter((activity) => {
    if (!activity || !activity.startTimeGMT) return false;
    try {
      const activityDate = new Date(activity.startTimeGMT);
      if (isNaN(activityDate.getTime())) return false;
      return activityDate >= startDate && activityDate <= endDate;
    } catch (error) {
      return false;
    }
  });
};

/**
 * Group activities by week
 * @param {Array} activities - Activities to group
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Array} Array of week objects with activities
 */
export const groupActivitiesByWeek = (activities, weekStartDay = 0) => {
  const weeks = {};
  activities.forEach((activity) => {
    if (!activity || !activity.startTimeGMT) {
      return; // Skip activities without dates
    }

    let activityDate;
    try {
      activityDate = new Date(activity.startTimeGMT);
      // Check if date is valid
      if (isNaN(activityDate.getTime())) {
        console.warn(
          "Invalid date for activity:",
          activity.activityId,
          activity.startTimeGMT
        );
        return;
      }
    } catch (error) {
      console.warn(
        "Error parsing date for activity:",
        activity.activityId,
        error
      );
      return;
    }

    let weekStart;
    try {
      weekStart = getWeekStart(activityDate, weekStartDay);
      // Validate weekStart is valid
      if (!weekStart || isNaN(weekStart.getTime())) {
        console.warn(
          "Invalid weekStart date for activity:",
          activity.activityId,
          "date was:",
          activity.startTimeGMT
        );
        return;
      }
    } catch (error) {
      console.warn(
        "Error calculating weekStart for activity:",
        activity.activityId,
        error
      );
      return;
    }

    let weekKey;
    try {
      weekKey = weekStart.toISOString().split("T")[0];
    } catch (error) {
      console.warn(
        "Error converting weekStart to ISO string for activity:",
        activity.activityId,
        error
      );
      return;
    }

    if (!weeks[weekKey]) {
      let weekEnd;
      try {
        weekEnd = getWeekEnd(activityDate, weekStartDay);
        if (!weekEnd || isNaN(weekEnd.getTime())) {
          console.warn("Invalid weekEnd for activity:", activity.activityId);
          return;
        }
      } catch (error) {
        console.warn(
          "Error calculating weekEnd for activity:",
          activity.activityId,
          error
        );
        return;
      }
      weeks[weekKey] = {
        weekStart,
        weekEnd,
        activities: [],
      };
    }
    weeks[weekKey].activities.push(activity);
  });
  return Object.values(weeks).sort((a, b) => b.weekStart - a.weekStart);
};

/**
 * Calculate statistics for a set of activities
 * @param {Array} activities - Activities to calculate stats for
 * @returns {Object} Statistics object
 */
export const calculatePeriodStats = (activities) => {
  if (activities.length === 0) {
    return {
      totalDistance: 0,
      totalRuns: 0,
      totalTime: 0,
      avgPace: null,
      avgHR: null,
      avgAerobicEffort: null,
      avgAnaerobicEffort: null,
    };
  }

  const totalDistance = activities.reduce(
    (sum, a) => sum + (a.distance || 0),
    0
  );
  const totalTime = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  const speeds = activities
    .filter((a) => a.averageSpeed && a.averageSpeed > 0)
    .map((a) => a.averageSpeed);
  const avgPace =
    speeds.length > 0
      ? 1000 / (speeds.reduce((a, b) => a + b, 0) / speeds.length) / 60
      : null;

  const heartRates = activities
    .filter((a) => a.averageHR)
    .map((a) => a.averageHR);
  const avgHR =
    heartRates.length > 0
      ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      : null;

  const aerobicEfforts = activities
    .filter((a) => a.aerobicTrainingEffect)
    .map((a) => a.aerobicTrainingEffect);
  const avgAerobicEffort =
    aerobicEfforts.length > 0
      ? aerobicEfforts.reduce((a, b) => a + b, 0) / aerobicEfforts.length
      : null;

  const anaerobicEfforts = activities
    .filter((a) => a.anaerobicTrainingEffect)
    .map((a) => a.anaerobicTrainingEffect);
  const avgAnaerobicEffort =
    anaerobicEfforts.length > 0
      ? anaerobicEfforts.reduce((a, b) => a + b, 0) / anaerobicEfforts.length
      : null;

  return {
    totalDistance,
    totalRuns: activities.length,
    totalTime,
    avgPace,
    avgHR,
    avgAerobicEffort,
    avgAnaerobicEffort,
  };
};

