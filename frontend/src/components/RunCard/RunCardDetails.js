import React from "react";
import { formatDistance, formatDuration, formatPace } from "../../utils/formatters";
import SplitsTable from "./SplitsTable";
import "./RunCard.css";

const RunCardDetails = ({ run, splits, unit }) => {
  const pace = run.averageSpeed ? formatPace(run.averageSpeed, unit) : "N/A";

  return (
    <div className="running-card-details">
      {run.locationName && (
        <p className="run-location">📍 {run.locationName}</p>
      )}
      <div className="running-metrics">
        <div className="metric-group primary">
          <div className="metric">
            <span className="metric-label">Distance</span>
            <span className="metric-value">
              {formatDistance(run.distance, unit)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Pace</span>
            <span className="metric-value">{pace}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Duration</span>
            <span className="metric-value">
              {formatDuration(run.duration)}
            </span>
          </div>
        </div>
        <div className="metric-group secondary">
          {run.averageHR && (
            <div className="metric">
              <span className="metric-label">Avg HR</span>
              <span className="metric-value">
                {Math.round(run.averageHR)} bpm
              </span>
            </div>
          )}
          {run.averageRunningCadenceInStepsPerMinute && (
            <div className="metric">
              <span className="metric-label">Cadence</span>
              <span className="metric-value">
                {Math.round(run.averageRunningCadenceInStepsPerMinute)} spm
              </span>
            </div>
          )}
          {run.avgStrideLength && (
            <div className="metric">
              <span className="metric-label">Stride</span>
              <span className="metric-value">
                {Math.round(run.avgStrideLength)} cm
              </span>
            </div>
          )}
          {run.elevationGain > 0 && (
            <div className="metric">
              <span className="metric-label">Elevation</span>
              <span className="metric-value">
                +{Math.round(run.elevationGain)} m
              </span>
            </div>
          )}
          {run.calories && (
            <div className="metric">
              <span className="metric-label">Calories</span>
              <span className="metric-value">{run.calories}</span>
            </div>
          )}
          {run.aerobicTrainingEffect && (
            <div className="metric">
              <span className="metric-label">Aerobic</span>
              <span className="metric-value">
                {run.aerobicTrainingEffect.toFixed(1)}/5
              </span>
            </div>
          )}
          {run.anaerobicTrainingEffect > 0 && (
            <div className="metric">
              <span className="metric-label">Anaerobic</span>
              <span className="metric-value">
                {run.anaerobicTrainingEffect.toFixed(1)}/5
              </span>
            </div>
          )}
        </div>
      </div>
      {run.aerobicTrainingEffect && (
        <div className="training-effect">
          <span className="te-label">Training Effect:</span>
          <span className="te-value">
            Aerobic: {run.aerobicTrainingEffect.toFixed(1)}
            {run.anaerobicTrainingEffect > 0 &&
              ` | Anaerobic: ${run.anaerobicTrainingEffect.toFixed(1)}`}
          </span>
        </div>
      )}
      {/* Fastest Splits */}
      {((unit === "km" && run.fastestSplit_1000) ||
        (unit === "miles" && run.fastestSplit_1609)) && (
        <div className="splits-section">
          <h4 className="splits-title">Fastest Split</h4>
          <div className="splits-grid">
            {unit === "km" && run.fastestSplit_1000 && (
              <div className="split-item">
                <span className="split-label">1 km</span>
                <span className="split-value">
                  {formatDuration(run.fastestSplit_1000)}
                </span>
              </div>
            )}
            {unit === "miles" && run.fastestSplit_1609 && (
              <div className="split-item">
                <span className="split-label">1 mile</span>
                <span className="split-value">
                  {formatDuration(run.fastestSplit_1609)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Splits Table */}
      <div className="splits-toggle-section">
        <SplitsTable splits={splits} unit={unit} />
      </div>
    </div>
  );
};

export default RunCardDetails;

