import apiFetch from "./api";

/**
 * Get Garmin connection status
 * @returns {Promise<Object>} Connection status
 */
export const getGarminStatus = async () => {
  return await apiFetch("/garmin/status");
};

/**
 * Connect Garmin account
 * @param {string} email - Garmin email
 * @param {string} password - Garmin password
 * @param {boolean} testCredentials - Whether to test credentials before saving
 * @returns {Promise<Object>} Connection result
 */
export const connectGarmin = async (email, password, testCredentials = true) => {
  return await apiFetch("/garmin/connect", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      testCredentials,
    }),
  });
};

/**
 * Update Garmin credentials
 * @param {string} email - Garmin email
 * @param {string} password - Garmin password
 * @returns {Promise<Object>} Update result
 */
export const updateGarminCredentials = async (email, password) => {
  return await apiFetch("/garmin/connect", {
    method: "PUT",
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

/**
 * Disconnect Garmin account
 * @returns {Promise<Object>} Disconnect result
 */
export const disconnectGarmin = async () => {
  return await apiFetch("/garmin/connect", {
    method: "DELETE",
  });
};

