import React from "react";
import { formatPace, formatTimeString } from "../../utils/formatters";
import "./RunCard.css";

const SplitsTable = ({ splits, unit }) => {
  if (!splits?.data || splits.data.length === 0) {
    return (
      <p className="no-splits">
        No split data available. Splits may need to be imported from FIT files.
      </p>
    );
  }

  const firstSplit = splits.data[0];

  return (
    <div className="splits-table">
      <table>
        <thead>
          <tr>
            <th>{unit === "miles" ? "Mile" : "Km"}</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
            {firstSplit.avg_hr && <th>Avg HR</th>}
            {firstSplit.max_hr && <th>Max HR</th>}
            {firstSplit.avg_speed && <th>Avg Speed</th>}
            {firstSplit.max_speed && <th>Max Speed</th>}
            {firstSplit.avg_cadence && <th>Avg Cadence</th>}
            {firstSplit.max_cadence && <th>Max Cadence</th>}
          </tr>
        </thead>
        <tbody>
          {splits.data.map((split, idx) => {
            const splitDistance =
              unit === "miles"
                ? (split.distance || 0) * 0.000621371
                : (split.distance || 0) / 1000;
            const splitPace =
              split.avg_speed && split.avg_speed > 0
                ? formatPace(split.avg_speed, unit)
                : "N/A";
            const avgSpeedDisplay =
              split.avg_speed && split.avg_speed > 0
                ? formatPace(split.avg_speed, unit)
                : "N/A";
            const maxSpeedDisplay =
              split.max_speed && split.max_speed > 0
                ? formatPace(split.max_speed, unit)
                : "N/A";
            return (
              <tr key={idx}>
                <td>{split.split}</td>
                <td>
                  {splitDistance.toFixed(2)} {unit === "miles" ? "mi" : "km"}
                </td>
                <td>{formatTimeString(split.elapsed_time)}</td>
                <td>{splitPace}</td>
                {split.avg_hr && <td>{Math.round(split.avg_hr)} bpm</td>}
                {split.max_hr && <td>{Math.round(split.max_hr)} bpm</td>}
                {split.avg_speed && <td>{avgSpeedDisplay}</td>}
                {split.max_speed && <td>{maxSpeedDisplay}</td>}
                {split.avg_cadence && (
                  <td>{Math.round(split.avg_cadence)} spm</td>
                )}
                {split.max_cadence && (
                  <td>{Math.round(split.max_cadence)} spm</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SplitsTable;

