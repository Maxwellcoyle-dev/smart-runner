import React from "react";
import { formatDistance, formatDuration, formatPace, formatDateTime } from "../../utils/formatters";
import RunCardDetails from "./RunCardDetails";
import "./RunCard.css";

const RunCard = ({
  run,
  isCompact = true,
  isExpanded,
  onToggle,
  splits,
  unit,
}) => {
  const pace = run.averageSpeed ? formatPace(run.averageSpeed, unit) : "N/A";

  return (
    <div
      className={`running-card ${isCompact ? "compact" : ""} ${
        isExpanded ? "expanded" : ""
      }`}
    >
      {/* Compact Header - Always visible */}
      <div
        className="running-card-compact-header"
        onClick={() => onToggle(run.activityId)}
      >
        <div className="compact-info">
          <span className="compact-date">
            {formatDateTime(run.startTimeGMT)}
          </span>
          <span className="compact-name">
            {run.activityName || "Running"}
          </span>
        </div>
        <div className="compact-metrics">
          <span className="compact-metric">
            {formatDistance(run.distance, unit)}
          </span>
          <span className="compact-metric">{pace}</span>
          <span className="compact-metric">
            {formatDuration(run.duration)}
          </span>
        </div>
        <span className="expand-toggle">{isExpanded ? "▼" : "▶"}</span>
      </div>

      {/* Expanded Details - Only shown when expanded */}
      {isExpanded && (
        <RunCardDetails run={run} splits={splits} unit={unit} />
      )}
    </div>
  );
};

export default RunCard;

