import { useState, useCallback } from "react";
import {
  navigatePeriod as navigatePeriodUtil,
  canNavigateForward as canNavigateForwardUtil,
} from "../utils/dateUtils";

/**
 * Custom hook for managing period navigation (week/month view)
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Object} Period state and functions
 */
export const usePeriod = (weekStartDay = 0) => {
  const [viewMode, setViewMode] = useState("month"); // 'week' or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());

  const navigatePeriod = useCallback(
    (direction) => {
      const newDate = navigatePeriodUtil(
        selectedDate,
        viewMode,
        direction,
        weekStartDay
      );
      if (newDate) {
        setSelectedDate(newDate);
      }
    },
    [selectedDate, viewMode, weekStartDay]
  );

  const canNavigateForward = useCallback(() => {
    return canNavigateForwardUtil(selectedDate, viewMode, weekStartDay);
  }, [selectedDate, viewMode, weekStartDay]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const toggleWeekExpanded = useCallback((weekKey) => {
    setExpandedWeeks((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(weekKey)) {
        newExpanded.delete(weekKey);
      } else {
        newExpanded.add(weekKey);
      }
      return newExpanded;
    });
  }, []);

  return {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    expandedWeeks,
    navigatePeriod,
    canNavigateForward,
    goToToday,
    toggleWeekExpanded,
  };
};

