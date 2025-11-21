import { useState, useCallback } from "react";
import { fetchSyncStatus, syncData as syncDataService } from "../services/activityService";

/**
 * Custom hook for managing sync operations and status
 * @returns {Object} Sync state and functions
 */
export const useSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await fetchSyncStatus();
      if (status) {
        setSyncStatus(status);
      }
    } catch (err) {
      console.error("Error fetching sync status:", err);
    }
  }, []);

  const sync = useCallback(async () => {
    try {
      setSyncing(true);
      const syncResult = await syncDataService();
      console.log("Sync completed:", syncResult);
      
      // Update sync status after sync
      await fetchStatus();
      
      return syncResult;
    } catch (err) {
      console.error("Error syncing data:", err);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  return {
    syncing,
    syncStatus,
    fetchStatus,
    sync,
  };
};

