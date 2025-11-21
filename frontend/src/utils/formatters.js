/**
 * Formatting utility functions for displaying data
 */

/**
 * Format distance in meters to km or miles
 * @param {number} meters - Distance in meters
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters, unit = "km") => {
  if (!meters) return `0 ${unit === "miles" ? "mi" : "km"}`;
  if (unit === "miles") {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(2)} mi`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format pace from meters per second to min/km or min/mile
 * @param {number} metersPerSecond - Speed in meters per second
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Formatted pace string
 */
export const formatPace = (metersPerSecond, unit = "km") => {
  if (!metersPerSecond || metersPerSecond <= 0) return "N/A";
  if (unit === "miles") {
    // Convert m/s to min/mile
    const paceMinPerMile = 1609.34 / (metersPerSecond * 60);
    const minutes = Math.floor(paceMinPerMile);
    const seconds = Math.floor((paceMinPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`;
  }
  // Convert m/s to min/km
  const paceMinPerKm = 1000 / (metersPerSecond * 60);
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.floor((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
};

/**
 * Format date and time string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
};

/**
 * Format time string (HH:MM:SS or MM:SS) to display format
 * @param {string|number} timeString - Time string or seconds
 * @returns {string} Formatted time string
 */
export const formatTimeString = (timeString) => {
  if (!timeString) return "N/A";
  // If it's already a string in HH:MM:SS format, return it
  if (typeof timeString === "string" && timeString.includes(":")) {
    const parts = timeString.split(":");
    if (parts.length === 3) {
      // HH:MM:SS format
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else if (parts.length === 2) {
      // MM:SS format
      return timeString;
    }
  }
  // Fallback: treat as seconds number
  return formatDuration(timeString);
};

