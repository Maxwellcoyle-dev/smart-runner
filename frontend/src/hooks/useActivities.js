import { useState, useCallback } from "react";
import { fetchActivities, fetchSplits } from "../services/activityService";

/**
 * Custom hook for managing activities data
 * @returns {Object} Activities state and functions
 */
export const useActivities = () => {
  const [runningActivities, setRunningActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runSplits, setRunSplits] = useState({});
  const [expandedRuns, setExpandedRuns] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const runningData = await fetchActivities();
      setRunningActivities(runningData.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRunExpanded = useCallback(
    async (activityId, unit = "km") => {
      const newExpanded = new Set(expandedRuns);
      if (newExpanded.has(activityId)) {
        newExpanded.delete(activityId);
      } else {
        newExpanded.add(activityId);
        // Fetch splits if not already loaded
        if (!runSplits[activityId]) {
          try {
            console.log(`Fetching splits for activity ${activityId}`);
            const splitsData = await fetchSplits(activityId, unit);
            console.log(`Received splits data:`, splitsData);
            setRunSplits((prev) => ({ ...prev, [activityId]: splitsData }));
          } catch (err) {
            console.error("Error fetching splits:", err);
          }
        }
      }
      setExpandedRuns(newExpanded);
    },
    [expandedRuns, runSplits]
  );

  return {
    runningActivities,
    loading,
    error,
    runSplits,
    expandedRuns,
    fetchData,
    toggleRunExpanded,
  };
};

