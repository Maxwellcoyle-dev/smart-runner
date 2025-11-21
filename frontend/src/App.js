import { useEffect, useCallback } from "react";
import "./App.css";

// Components
import Loading from "./components/Loading/Loading";
import Error from "./components/Error/Error";
import Header from "./components/Header/Header";
import PeriodNavigation from "./components/PeriodNavigation/PeriodNavigation";
import SummaryCards from "./components/SummaryCards/SummaryCards";
import ChartsSection from "./components/Charts/ChartsSection";
import WeeklyBreakdown from "./components/WeeklyBreakdown/WeeklyBreakdown";
import SettingsModal from "./components/SettingsModal/SettingsModal";

// Hooks
import { useSettings } from "./hooks/useSettings";
import { useSync } from "./hooks/useSync";
import { useActivities } from "./hooks/useActivities";
import { usePeriod } from "./hooks/usePeriod";

// Utils
import {
  getPeriodActivities,
  calculatePeriodStats,
} from "./utils/calculations";
import { useState } from "react";

function App() {
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

  return (
    <div className="App">
      <div className="container">
        <Header
          syncStatus={syncStatus}
          onSettingsClick={() => setShowSettings(true)}
          onRefresh={handleRefresh}
          syncing={syncing}
          loading={loading}
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
            onClose={() => setShowSettings(false)}
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

export default App;
