import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatDateRange } from "../../utils/dateUtils";
import { groupActivitiesByWeek, calculatePeriodStats } from "../../utils/calculations";
import "./ChartsSection.css";

const ChartsSection = ({ periodActivities, viewMode, unit }) => {
  if (periodActivities.length === 0) return null;

  // Prepare chart data
  // Create cumulative distance chart data
  const sortedActivities = [...periodActivities].sort(
    (a, b) => new Date(a.startTimeGMT) - new Date(b.startTimeGMT)
  );
  let cumulativeDistance = 0;
  const distanceChartData = sortedActivities.map((run) => {
    const runDistance =
      unit === "miles" ? (run.distance || 0) * 0.000621371 : (run.distance || 0) / 1000;
    cumulativeDistance += runDistance;
    return {
      date: new Date(run.startTimeGMT).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      distance: Math.round(cumulativeDistance * 100) / 100, // Round to 2 decimals
    };
  });

  const paceChartData = periodActivities
    .filter((run) => run.averageSpeed && run.averageSpeed > 0)
    .map((run) => {
      // averageSpeed is in m/s
      // Pace = time per unit distance
      // For km: pace (min/km) = (1000 meters) / (speed m/s) / 60 seconds
      // For miles: pace (min/mi) = (1609.34 meters) / (speed m/s) / 60 seconds
      const distanceInMeters = unit === "miles" ? 1609.34 : 1000;
      const paceSecondsPerUnit = distanceInMeters / run.averageSpeed;
      const paceMinutesPerUnit = paceSecondsPerUnit / 60;
      // Convert to minutes.decimal format for chart (e.g., 5.5 = 5:30)
      const minutes = Math.floor(paceMinutesPerUnit);
      const seconds = (paceMinutesPerUnit - minutes) * 60;
      const paceDecimal = minutes + seconds / 60;

      return {
        date: new Date(run.startTimeGMT).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pace: Math.round(paceDecimal * 100) / 100, // Round to 2 decimals
      };
    })
    .reverse();

  const hrChartData = periodActivities
    .filter((run) => run.averageHR)
    .map((run) => ({
      date: new Date(run.startTimeGMT).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      hr: run.averageHR,
    }))
    .reverse();

  // Weekly volume data for month view
  const weeklyVolumeData =
    viewMode === "month"
      ? groupActivitiesByWeek(periodActivities).map((week) => {
          const weekStats = calculatePeriodStats(week.activities);
          return {
            week: formatDateRange(week.weekStart, week.weekEnd),
            distance:
              Math.round(
                (unit === "miles"
                  ? weekStats.totalDistance * 0.000621371
                  : weekStats.totalDistance / 1000) * 100
              ) / 100,
            runs: weekStats.totalRuns,
          };
        })
      : [];

  return (
    <section className="charts-section">
      <h2>Progress Charts</h2>
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Distance Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={distanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#667eea"
                strokeWidth={2}
                name={`Distance (${unit === "miles" ? "mi" : "km"})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3>Pace Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => {
                  const minutes = Math.floor(value);
                  const seconds = Math.round((value - minutes) * 60);
                  return `${minutes}:${seconds
                    .toString()
                    .padStart(2, "0")} / ${unit === "miles" ? "mi" : "km"}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pace"
                stroke="#ff6b6b"
                strokeWidth={2}
                name={`Pace (min/${unit === "miles" ? "mi" : "km"})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3>Heart Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hrChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="hr"
                stroke="#51cf66"
                strokeWidth={2}
                name="Heart Rate (bpm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {viewMode === "month" && weeklyVolumeData.length > 0 && (
          <div className="chart-container">
            <h3>Weekly Volume</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="distance"
                  fill="#667eea"
                  name={`Distance (${unit === "miles" ? "mi" : "km"})`}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChartsSection;

