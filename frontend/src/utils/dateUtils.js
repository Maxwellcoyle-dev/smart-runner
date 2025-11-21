/**
 * Date utility functions for period calculations and navigation
 */

/**
 * Get the start of the week for a given date
 * @param {Date} date - The date to calculate week start for
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Date} Start of the week
 */
export const getWeekStart = (date, weekStartDay = 0) => {
  if (!date) {
    console.error("No date passed to getWeekStart");
    return new Date();
  }

  // Validate and normalize weekStartDay (0 = Sunday, 6 = Saturday)
  let validWeekStartDay;
  if (
    weekStartDay === undefined ||
    weekStartDay === null ||
    isNaN(weekStartDay)
  ) {
    validWeekStartDay = 0;
  } else {
    validWeekStartDay = Number(weekStartDay);
  }

  // Ensure it's a valid day (0-6)
  if (
    isNaN(validWeekStartDay) ||
    validWeekStartDay < 0 ||
    validWeekStartDay > 6
  ) {
    console.warn(
      "Invalid weekStartDay, using default (0 = Sunday):",
      weekStartDay
    );
    validWeekStartDay = 0;
  }

  // Ensure date is a Date object
  let d;
  try {
    d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  } catch (error) {
    console.error("Error creating date object:", error, date);
    return new Date();
  }

  // Validate date
  if (isNaN(d.getTime())) {
    console.error("Invalid date passed to getWeekStart:", date);
    return new Date();
  }

  try {
    // Get the day of week (0 = Sunday, 6 = Saturday)
    const day = d.getDay();

    // Calculate days to subtract to get to week start
    let diff;
    if (day >= validWeekStartDay) {
      diff = day - validWeekStartDay;
    } else {
      diff = 7 - (validWeekStartDay - day);
    }

    // Validate diff is a number
    if (isNaN(diff) || diff < 0 || diff > 6) {
      console.error("Invalid diff calculation:", {
        day,
        validWeekStartDay,
        diff,
      });
      return new Date();
    }

    // Use milliseconds to avoid date arithmetic issues
    const msPerDay = 24 * 60 * 60 * 1000;
    const weekStartMs = d.getTime() - diff * msPerDay;
    const weekStart = new Date(weekStartMs);

    // Set to midnight
    weekStart.setHours(0, 0, 0, 0);

    // Validate result
    if (isNaN(weekStart.getTime())) {
      console.error(
        "Invalid result from getWeekStart calculation, input:",
        date,
        "diff:",
        diff
      );
      return new Date();
    }

    return weekStart;
  } catch (error) {
    console.error("Error in getWeekStart:", error, "input:", date);
    return new Date();
  }
};

/**
 * Get the end of the week for a given date
 * @param {Date} date - The date to calculate week end for
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Date} End of the week
 */
export const getWeekEnd = (date, weekStartDay = 0) => {
  if (!date) {
    console.error("No date passed to getWeekEnd");
    return new Date();
  }

  // Validate and normalize weekStartDay
  let validWeekStartDay;
  if (
    weekStartDay === undefined ||
    weekStartDay === null ||
    isNaN(weekStartDay)
  ) {
    validWeekStartDay = 0;
  } else {
    validWeekStartDay = Number(weekStartDay);
  }

  // Ensure it's a valid day (0-6)
  if (
    isNaN(validWeekStartDay) ||
    validWeekStartDay < 0 ||
    validWeekStartDay > 6
  ) {
    validWeekStartDay = 0;
  }

  const weekStart = getWeekStart(date, validWeekStartDay);
  // Validate weekStart
  if (!weekStart || isNaN(weekStart.getTime())) {
    console.error("Invalid weekStart in getWeekEnd, date was:", date);
    return new Date();
  }
  try {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    // Validate result
    if (isNaN(weekEnd.getTime())) {
      console.error("Invalid result from getWeekEnd calculation");
      return new Date();
    }
    return weekEnd;
  } catch (error) {
    console.error("Error in getWeekEnd:", error);
    return new Date();
  }
};

/**
 * Get the start of the month for a given date
 * @param {Date} date - The date to calculate month start for
 * @returns {Date} Start of the month
 */
export const getMonthStart = (date) => {
  const d = new Date(date);
  // Validate date
  if (isNaN(d.getTime())) {
    console.error("Invalid date passed to getMonthStart:", date);
    return new Date();
  }
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the month for a given date
 * @param {Date} date - The date to calculate month end for
 * @returns {Date} End of the month
 */
export const getMonthEnd = (date) => {
  const d = new Date(date);
  // Validate date
  if (isNaN(d.getTime())) {
    console.error("Invalid date passed to getMonthEnd:", date);
    return new Date();
  }
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Format a date range as a string
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (start, end) => {
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} - ${endStr}`;
};

/**
 * Navigate to the next or previous period
 * @param {Date} selectedDate - Current selected date
 * @param {string} viewMode - 'week' or 'month'
 * @param {number} direction - -1 for previous, 1 for next
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {Date|null} New date or null if navigation not allowed
 */
export const navigatePeriod = (
  selectedDate,
  viewMode,
  direction,
  weekStartDay = 0
) => {
  const newDate = new Date(selectedDate);
  const now = new Date();

  if (viewMode === "month") {
    newDate.setMonth(newDate.getMonth() + direction);
    // Don't allow going beyond current month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();
    if (
      newYear > currentYear ||
      (newYear === currentYear && newMonth > currentMonth)
    ) {
      return null; // Don't navigate forward beyond current month
    }
  } else {
    // For week view, navigate by 7 days using milliseconds to avoid date arithmetic issues
    const msPerDay = 24 * 60 * 60 * 1000;
    const newDateMs = newDate.getTime() + direction * 7 * msPerDay;
    const tempDate = new Date(newDateMs);

    // Validate the new date
    if (isNaN(tempDate.getTime())) {
      console.error("Invalid date after navigation");
      return null;
    }

    // Don't allow going beyond current week
    const currentWeekStart = getWeekStart(now, weekStartDay);
    const newWeekStart = getWeekStart(tempDate, weekStartDay);

    // Validate week starts are valid
    if (
      !currentWeekStart ||
      !newWeekStart ||
      isNaN(currentWeekStart.getTime()) ||
      isNaN(newWeekStart.getTime())
    ) {
      console.error("Invalid week start dates during navigation");
      return null;
    }

    if (newWeekStart > currentWeekStart) {
      return null; // Don't navigate forward beyond current week
    }

    newDate.setTime(newDateMs);
  }

  // Validate final date before returning
  if (isNaN(newDate.getTime())) {
    console.error("Invalid date after navigation calculation");
    return null;
  }

  return newDate;
};

/**
 * Check if we can navigate forward
 * @param {Date} selectedDate - Current selected date
 * @param {string} viewMode - 'week' or 'month'
 * @param {number} weekStartDay - Day of week (0 = Sunday, 6 = Saturday)
 * @returns {boolean} True if forward navigation is allowed
 */
export const canNavigateForward = (
  selectedDate,
  viewMode,
  weekStartDay = 0
) => {
  const now = new Date();
  if (viewMode === "month") {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    return !(selectedYear >= currentYear && selectedMonth >= currentMonth);
  } else {
    const currentWeekStart = getWeekStart(now, weekStartDay);
    const selectedWeekStart = getWeekStart(selectedDate, weekStartDay);
    return selectedWeekStart < currentWeekStart;
  }
};

