import React from "react";
import { formatDistance } from "../../utils/formatters";
import { formatDateRange } from "../../utils/dateUtils";
import { calculatePeriodStats } from "../../utils/calculations";
import RunCard from "../RunCard/RunCard";
import "./WeeklyBreakdown.css";

const WeekSection = ({
  week,
  weekIndex,
  isExpanded,
  onToggle,
  expandedRuns,
  onToggleRun,
  runSplits,
  unit,
}) => {
  const weekKey = week.weekStart.toISOString();
  const weekStats = calculatePeriodStats(week.activities);

  return (
    <div className="week-section">
      <div className="week-header" onClick={() => onToggle(weekKey)}>
        <div className="week-title">
          <span className="week-toggle">{isExpanded ? "▼" : "▶"}</span>
          <span>
            Week {weekIndex + 1} ({formatDateRange(week.weekStart, week.weekEnd)})
          </span>
        </div>
        <div className="week-summary">
          <span>{weekStats.totalRuns} runs</span>
          <span>{formatDistance(weekStats.totalDistance, unit)}</span>
          <span>
            {weekStats.avgPace
              ? `${Math.floor(weekStats.avgPace)}:${Math.floor(
                  (weekStats.avgPace % 1) * 60
                )
                  .toString()
                  .padStart(2, "0")}/${unit === "miles" ? "mi" : "km"}`
              : "N/A"}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="week-activities">
          {week.activities
            .sort(
              (a, b) =>
                new Date(b.startTimeGMT) - new Date(a.startTimeGMT)
            )
            .map((run) => (
              <RunCard
                key={run.activityId}
                run={run}
                isCompact={true}
                isExpanded={expandedRuns.has(run.activityId)}
                onToggle={onToggleRun}
                splits={runSplits[run.activityId]}
                unit={unit}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default WeekSection;

