import { useEffect, useCallback, useState } from "react";
import "../App.css";
import { useAuth } from "../contexts/AuthContext";

// Components
import Loading from "../components/Loading/Loading";
import Error from "../components/Error/Error";
import Header from "../components/Header/Header";
import PeriodNavigation from "../components/PeriodNavigation/PeriodNavigation";
import SummaryCards from "../components/SummaryCards/SummaryCards";
import ChartsSection from "../components/Charts/ChartsSection";
import WeeklyBreakdown from "../components/WeeklyBreakdown/WeeklyBreakdown";
import SettingsModal from "../components/SettingsModal/SettingsModal";
import Onboarding from "../components/Onboarding/Onboarding";

// Hooks
import { useSettings } from "../hooks/useSettings";
import { useSync } from "../hooks/useSync";
import { useActivities } from "../hooks/useActivities";
import { usePeriod } from "../hooks/usePeriod";
import { useOnboarding } from "../hooks/useOnboarding";

// Utils
import {
  getPeriodActivities,
  calculatePeriodStats,
} from "../utils/calculations";

function Dashboard() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useSettings();
  const { syncing, syncStatus, fetchStatus, sync } = useSync();
  const {
    runningActivities,
    loading,
    error,
    runSplits,
    expandedRuns,
    fetchData,
    toggleRunExpanded,
  } = useActivities();
  const {
    viewMode,
    setViewMode,
    selectedDate,
    expandedWeeks,
    navigatePeriod,
    canNavigateForward,
    goToToday,
    toggleWeekExpanded,
  } = usePeriod(settings.weekStartDay);

  const [showSettings, setShowSettings] = useState(false);
  const [garminConnected, setGarminConnected] = useState(false);
  const [checkingGarmin, setCheckingGarmin] = useState(true);
  
  const {
    shouldShow: shouldShowOnboarding,
    checkShouldShow,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
    forceShowOnboarding,
  } = useOnboarding();

  const handleRefresh = useCallback(async () => {
    try {
      await sync();
      await fetchData();
    } catch (err) {
      console.error("Error refreshing:", err);
    }
  }, [sync, fetchData]);

  const handleToggleRunExpanded = useCallback(
    (activityId) => {
      toggleRunExpanded(activityId, settings.unit);
    },
    [toggleRunExpanded, settings.unit]
  );

  // Check Garmin connection status for onboarding
  useEffect(() => {
    const checkGarminStatus = async () => {
      try {
        const { getGarminStatus } = await import("../services/garminService");
        const status = await getGarminStatus();
        setGarminConnected(status?.connected || false);
      } catch (error) {
        console.error("Error checking Garmin status:", error);
        setGarminConnected(false);
      } finally {
        setCheckingGarmin(false);
      }
    };
    
    checkGarminStatus();
  }, []);

  // Determine if onboarding should be shown
  useEffect(() => {
    if (!checkingGarmin && !loading) {
      checkShouldShow(garminConnected, runningActivities?.length || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingGarmin, loading, garminConnected, runningActivities?.length]);

  useEffect(() => {
    fetchData(); // Don't sync on initial load
    fetchStatus();
  }, [fetchData, fetchStatus]);

  // Get activities for current period
  const periodActivities = getPeriodActivities(
    runningActivities,
    selectedDate,
    viewMode,
    settings.weekStartDay
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} onRetry={fetchData} />;
  }

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    // Re-check Garmin status after settings close in case user connected
    const checkGarminStatus = async () => {
      try {
        const { getGarminStatus } = await import("../services/garminService");
        const status = await getGarminStatus();
        setGarminConnected(status?.connected || false);
      } catch (error) {
        console.error("Error checking Garmin status:", error);
      }
    };
    setTimeout(checkGarminStatus, 1000);
  };

  const handleShowOnboarding = () => {
    forceShowOnboarding();
  };

  return (
    <div className="App">
      <div className="container">
        {shouldShowOnboarding && !loading && !checkingGarmin && (
          <Onboarding
            onComplete={completeOnboarding}
            onDismiss={dismissOnboarding}
            activitiesCount={runningActivities?.length || 0}
            onOpenSettings={handleOpenSettings}
          />
        )}

        <Header
          syncStatus={syncStatus}
          onSettingsClick={() => setShowSettings(true)}
          onRefresh={handleRefresh}
          syncing={syncing}
          loading={loading}
          user={user}
          onLogout={logout}
        />

        <PeriodNavigation
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          onNavigate={navigatePeriod}
          canNavigateForward={canNavigateForward}
          onGoToToday={goToToday}
          weekStartDay={settings.weekStartDay}
        />

        {showSettings && (
          <SettingsModal
            settings={settings}
            onSettingsChange={setSettings}
            onClose={handleSettingsClose}
            onShowOnboarding={handleShowOnboarding}
          />
        )}

        <SummaryCards
          periodStats={calculatePeriodStats(periodActivities)}
          unit={settings.unit}
        />

        <ChartsSection
          periodActivities={periodActivities}
          viewMode={viewMode}
          unit={settings.unit}
        />

        <WeeklyBreakdown
          periodActivities={periodActivities}
          viewMode={viewMode}
          expandedWeeks={expandedWeeks}
          onToggleWeek={toggleWeekExpanded}
          expandedRuns={expandedRuns}
          onToggleRun={handleToggleRunExpanded}
          runSplits={runSplits}
          unit={settings.unit}
          weekStartDay={settings.weekStartDay}
        />
      </div>
    </div>
  );
}

export default Dashboard;

