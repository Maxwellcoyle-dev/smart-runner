import React from "react";
import { formatDateRange, getWeekStart, getWeekEnd } from "../../utils/dateUtils";
import "./PeriodNavigation.css";

const PeriodNavigation = ({
  viewMode,
  setViewMode,
  selectedDate,
  onNavigate,
  canNavigateForward,
  onGoToToday,
  weekStartDay,
}) => {
  return (
    <div className="period-navigation">
      <div className="period-nav-controls">
        <button
          className="nav-btn"
          onClick={() => onNavigate(-1)}
          title={`Previous ${viewMode}`}
        >
          ←
        </button>
        <div className="period-display">
          {viewMode === "month"
            ? selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : formatDateRange(
                getWeekStart(selectedDate, weekStartDay),
                getWeekEnd(selectedDate, weekStartDay)
              )}
        </div>
        <button
          className="nav-btn"
          onClick={() => onNavigate(1)}
          disabled={!canNavigateForward()}
          title={`Next ${viewMode}`}
        >
          →
        </button>
        <button
          className="nav-btn today-btn"
          onClick={onGoToToday}
          title="Go to current period"
        >
          Today
        </button>
      </div>
      <div className="view-toggle">
        <button
          className={`view-toggle-btn ${viewMode === "week" ? "active" : ""}`}
          onClick={() => setViewMode("week")}
        >
          Week
        </button>
        <button
          className={`view-toggle-btn ${viewMode === "month" ? "active" : ""}`}
          onClick={() => setViewMode("month")}
        >
          Month
        </button>
      </div>
    </div>
  );
};

export default PeriodNavigation;

