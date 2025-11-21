import apiFetch from "./api";

/**
 * Fetch all running activities
 * @returns {Promise<Object>} Response with activities data
 */
export const fetchActivities = async () => {
  return await apiFetch("/running");
};

/**
 * Fetch splits for a specific activity
 * @param {number|string} activityId - Activity ID
 * @param {string} unit - 'km' or 'miles'
 * @returns {Promise<Object>} Splits data
 */
export const fetchSplits = async (activityId, unit = "km") => {
  return await apiFetch(`/activities/${activityId}/splits?unit=${unit}`);
};

/**
 * Fetch sync status
 * @returns {Promise<Object>} Sync status data
 */
export const fetchSyncStatus = async () => {
  try {
    return await apiFetch("/sync/status");
  } catch (err) {
    console.error("Error fetching sync status:", err);
    return null;
  }
};

/**
 * Trigger a sync operation
 * @returns {Promise<Object>} Sync result
 */
export const syncData = async () => {
  return await apiFetch("/sync", {
    method: "POST",
  });
};

