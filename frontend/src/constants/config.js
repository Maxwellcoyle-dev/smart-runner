// Use environment variable in production, or proxy in development
// If REACT_APP_API_URL is set and doesn't end with /api, append it
const baseUrl = process.env.REACT_APP_API_URL || "/api";
export const API_BASE_URL =
  baseUrl.endsWith("/api") || baseUrl === "/api" ? baseUrl : `${baseUrl}/api`;

// Debug logging (only in development or if explicitly enabled)
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
  // Log in console for debugging
  if (
    process.env.NODE_ENV === "development" ||
    window.location.hostname.includes("vercel")
  ) {
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("REACT_APP_API_URL (raw):", process.env.REACT_APP_API_URL);
  }
}

export const DEFAULT_SETTINGS = {
  unit: "km", // 'km' or 'miles'
  weekStartDay: 0, // 0 = Sunday, 1 = Monday, etc.
};

export const SETTINGS_STORAGE_KEY = "garminSettings";
