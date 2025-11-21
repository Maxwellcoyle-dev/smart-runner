import React from "react";
import { groupActivitiesByWeek } from "../../utils/calculations";
import WeekSection from "./WeekSection";
import RunCard from "../RunCard/RunCard";
import "./WeeklyBreakdown.css";

const WeeklyBreakdown = ({
  periodActivities,
  viewMode,
  expandedWeeks,
  onToggleWeek,
  expandedRuns,
  onToggleRun,
  runSplits,
  unit,
  weekStartDay,
}) => {
  if (periodActivities.length === 0) {
    return (
      <div className="empty-state">
        <p>
          No runs found for this {viewMode}. Try selecting a different period.
        </p>
      </div>
    );
  }

  if (viewMode === "month") {
    // Show weekly breakdown
    const weeks = groupActivitiesByWeek(periodActivities, weekStartDay);
    return (
      <section className="weekly-breakdown">
        <h2>Weekly Breakdown</h2>
        {weeks.map((week, idx) => {
          const weekKey = week.weekStart.toISOString();
          const isExpanded = expandedWeeks.has(weekKey);
          return (
            <WeekSection
              key={weekKey}
              week={week}
              weekIndex={idx}
              isExpanded={isExpanded}
              onToggle={onToggleWeek}
              expandedRuns={expandedRuns}
              onToggleRun={onToggleRun}
              runSplits={runSplits}
              unit={unit}
            />
          );
        })}
      </section>
    );
  } else {
    // Week view - show all activities for the week
    const weeks = groupActivitiesByWeek(periodActivities, weekStartDay);
    if (weeks.length === 0) {
      return (
        <div className="empty-state">
          <p>No runs found for this week.</p>
        </div>
      );
    }
    // For week view, show the first (and only) week
    const week = weeks[0];
    return (
      <section className="weekly-breakdown">
        <h2>Runs This Week</h2>
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
      </section>
    );
  }
};

export default WeeklyBreakdown;

