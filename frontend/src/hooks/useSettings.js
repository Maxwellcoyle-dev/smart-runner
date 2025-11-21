import { useState, useEffect } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from "../constants/config";

/**
 * Custom hook for managing application settings with localStorage persistence
 * @returns {[Object, Function]} Settings object and setter function
 */
export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Ensure weekStartDay is a valid number
          weekStartDay:
            parsed.weekStartDay !== undefined &&
            !isNaN(Number(parsed.weekStartDay)) &&
            Number(parsed.weekStartDay) >= 0 &&
            Number(parsed.weekStartDay) <= 6
              ? Number(parsed.weekStartDay)
              : DEFAULT_SETTINGS.weekStartDay,
        };
      } catch (error) {
        console.error("Error parsing settings from localStorage:", error);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings];
};

