// Use environment variable in production, or proxy in development
export const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// Expose for debugging (will be replaced at build time)
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
}

export const DEFAULT_SETTINGS = {
  unit: "km", // 'km' or 'miles'
  weekStartDay: 0, // 0 = Sunday, 1 = Monday, etc.
};

export const SETTINGS_STORAGE_KEY = "garminSettings";
