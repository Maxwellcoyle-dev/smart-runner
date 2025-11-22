import { useState, useEffect } from "react";

const ONBOARDING_COMPLETE_KEY = "smart_runner_onboarding_complete";
const ONBOARDING_DISMISSED_KEY = "smart_runner_onboarding_dismissed";

/**
 * Custom hook to manage onboarding state
 * @returns {Object} Onboarding state and functions
 */
export const useOnboarding = () => {
  const [isComplete, setIsComplete] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if onboarding was previously completed or dismissed
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
    
    setIsComplete(completed);
    setIsDismissed(dismissed);
  }, []);

  /**
   * Determine if onboarding should be shown
   * @param {boolean} hasGarminConnected - Whether Garmin is connected
   * @param {number} activitiesCount - Number of activities
   */
  const checkShouldShow = (hasGarminConnected, activitiesCount) => {
    // Don't show if already completed or dismissed
    if (isComplete || isDismissed) {
      setShouldShow(false);
      return;
    }

    // Show if Garmin is not connected OR no activities exist
    const shouldShowOnboarding = !hasGarminConnected || activitiesCount === 0;
    setShouldShow(shouldShowOnboarding);
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    setIsComplete(true);
    setShouldShow(false);
  };

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    setIsDismissed(true);
    setShouldShow(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    setIsComplete(false);
    setIsDismissed(false);
    setShouldShow(true);
  };

  return {
    isComplete,
    isDismissed,
    shouldShow,
    checkShouldShow,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
  };
};

