import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getGarminStatus } from "../../services/garminService";
import "./Onboarding.css";

const Onboarding = ({
  onComplete,
  onDismiss,
  activitiesCount = 0,
  onOpenSettings,
}) => {
  const [garminStatus, setGarminStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const checkGarminStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await getGarminStatus();
      setGarminStatus(status);

      // Auto-advance to step 2 if Garmin is connected
      if (status?.connected && currentStep === 0) {
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Error checking Garmin status:", error);
      setGarminStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [currentStep]);

  useEffect(() => {
    checkGarminStatus();
  }, [checkGarminStatus]);

  // Update step completion status when activities count changes
  useEffect(() => {
    if (activitiesCount > 0 && currentStep === 1) {
      // Auto-advance to step 3 if activities are synced
      setCurrentStep(2);
    }
  }, [activitiesCount, currentStep]);

  const steps = useMemo(
    () => [
      {
        id: "connect-garmin",
        title: "Connect Your Garmin Account",
        description:
          "Link your Garmin Connect account to see your activities and progress in real time.",
        icon: "🔗",
        action: null,
        completed: garminStatus?.connected || false,
      },
      {
        id: "sync-data",
        title: "Sync Your Activities",
        description:
          "Once connected, sync whenever you want to see your activities and progress.",
        icon: "📥",
        action: "How to Sync",
        onAction: null,
        completed: activitiesCount > 0,
        info: "Click the 'Sync & Refresh' button in the header to download your activities from Garmin Connect. This will take a few minutes, depending on the number of activities you have.",
      },
      {
        id: "explore",
        title: "Explore Your Data",
        description:
          "View your runs, track progress, and analyze your training patterns.",
        icon: "📊",
        action: null,
        completed: false,
        info: "Use the week/month toggle to navigate through your activities. Click on any run to see detailed metrics.",
      },
    ],
    [garminStatus, activitiesCount, onOpenSettings, checkGarminStatus]
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleDismiss = () => {
    onDismiss();
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (loading) {
    return null;
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-header-content">
            <h2>Welcome to Smart Runner! 🏃</h2>
            <p>Let's get you set up in just a few steps</p>
          </div>
          <button
            className="onboarding-close"
            onClick={handleDismiss}
            aria-label="Dismiss onboarding"
          >
            ×
          </button>
        </div>

        <div className="onboarding-progress">
          <div className="onboarding-progress-bar">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="onboarding-progress-text">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-step-icon">{currentStepData.icon}</div>
          <h3>{currentStepData.title}</h3>
          <p className="onboarding-step-description">
            {currentStepData.description}
          </p>

          {currentStepData.info && (
            <div className="onboarding-step-info">
              <span className="info-icon">💡</span>
              <span>{currentStepData.info}</span>
            </div>
          )}

          {currentStepData.completed && (
            <div className="onboarding-step-completed">
              <span className="checkmark">✓</span>
              <span>Completed!</span>
            </div>
          )}

          {currentStepData.onAction && !currentStepData.completed && (
            <button
              className="onboarding-action-button"
              onClick={currentStepData.onAction}
            >
              {currentStepData.action}
            </button>
          )}
        </div>

        <div className="onboarding-steps-indicator">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`onboarding-step-dot ${
                index === currentStep
                  ? "active"
                  : index < currentStep
                  ? "completed"
                  : ""
              }`}
              onClick={() => setCurrentStep(index)}
            >
              {step.completed && index < currentStep && "✓"}
            </div>
          ))}
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-footer-buttons">
            {currentStep > 0 && (
              <button
                className="onboarding-button secondary"
                onClick={handlePrevious}
              >
                Previous
              </button>
            )}
            <div className="onboarding-footer-right">
              <button
                className="onboarding-button secondary"
                onClick={handleDismiss}
              >
                Skip
              </button>
              <button
                className="onboarding-button primary"
                onClick={
                  currentStep === steps.length - 1 ? handleComplete : handleNext
                }
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
