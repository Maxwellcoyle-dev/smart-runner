import React from "react";
import { formatDistance } from "../../utils/formatters";
import "./SummaryCards.css";

const SummaryCards = ({ periodStats, unit }) => {
  return (
    <section className="period-summary">
      <div className="summary-cards">
        <div className="summary-card highlight">
          <h3>Total Distance</h3>
          <p className="summary-value">
            {formatDistance(periodStats.totalDistance, unit)}
          </p>
        </div>
        <div className="summary-card highlight">
          <h3>Total Runs</h3>
          <p className="summary-value">{periodStats.totalRuns}</p>
        </div>
        <div className="summary-card highlight">
          <h3>Average Pace</h3>
          <p className="summary-value">
            {periodStats.avgPace
              ? `${Math.floor(periodStats.avgPace)}:${Math.floor(
                  (periodStats.avgPace % 1) * 60
                )
                  .toString()
                  .padStart(2, "0")}/${unit === "miles" ? "mi" : "km"}`
              : "N/A"}
          </p>
        </div>
        <div className="summary-card highlight">
          <h3>Avg Heart Rate</h3>
          <p className="summary-value">
            {periodStats.avgHR
              ? `${Math.round(periodStats.avgHR)} bpm`
              : "N/A"}
          </p>
        </div>
        <div className="summary-card">
          <h3>Average Run Distance</h3>
          <p className="summary-value">
            {periodStats.totalRuns > 0
              ? formatDistance(
                  periodStats.totalDistance / periodStats.totalRuns,
                  unit
                )
              : "N/A"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default SummaryCards;

