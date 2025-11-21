# Frontend Refactoring Strategy

## Current State Analysis

The `App.js` file is **1,526 lines** and contains:
- All state management (10+ useState hooks)
- All API calls (fetchSyncStatus, syncData, fetchData, toggleRunExpanded)
- All utility functions (date calculations, formatting)
- All UI components (rendered inline)
- All business logic (stats calculations, data grouping)

## Proposed Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header/
│   │   ├── Header.js
│   │   └── Header.css
│   ├── PeriodNavigation/
│   │   ├── PeriodNavigation.js
│   │   └── PeriodNavigation.css
│   ├── SummaryCards/
│   │   ├── SummaryCards.js
│   │   └── SummaryCards.css
│   ├── Charts/
│   │   ├── ChartsSection.js
│   │   ├── DistanceChart.js
│   │   ├── PaceChart.js
│   │   ├── HeartRateChart.js
│   │   ├── WeeklyVolumeChart.js
│   │   └── ChartsSection.css
│   ├── RunCard/
│   │   ├── RunCard.js
│   │   ├── RunCardDetails.js
│   │   ├── SplitsTable.js
│   │   └── RunCard.css
│   ├── WeeklyBreakdown/
│   │   ├── WeeklyBreakdown.js
│   │   ├── WeekSection.js
│   │   └── WeeklyBreakdown.css
│   ├── SettingsModal/
│   │   ├── SettingsModal.js
│   │   └── SettingsModal.css
│   └── Loading/
│       ├── Loading.js
│       └── Loading.css
│
├── hooks/               # Custom React hooks
│   ├── useActivities.js
│   ├── useSettings.js
│   ├── usePeriod.js
│   └── useSync.js
│
├── services/            # API and external services
│   ├── api.js
│   └── activityService.js
│
├── utils/               # Pure utility functions
│   ├── dateUtils.js
│   ├── formatters.js
│   └── calculations.js
│
├── constants/           # Constants and configuration
│   └── config.js
│
├── App.js              # Main app component (simplified)
├── App.css
└── index.js
```

## Refactoring Plan

### Phase 1: Extract Constants & Configuration
- Move `API_BASE_URL` to `constants/config.js`
- Add other configuration values

### Phase 2: Extract Utility Functions
- **dateUtils.js**: `getWeekStart`, `getWeekEnd`, `getMonthStart`, `getMonthEnd`, `formatDateRange`, `navigatePeriod`, `canNavigateForward`
- **formatters.js**: `formatDistance`, `formatDuration`, `formatPace`, `formatDateTime`, `formatTimeString`
- **calculations.js**: `calculatePeriodStats`, `groupActivitiesByWeek`, `getPeriodActivities`

### Phase 3: Extract API Services
- **api.js**: Base API configuration and error handling
- **activityService.js**: All activity-related API calls (fetchActivities, fetchSplits, syncData, fetchSyncStatus)

### Phase 4: Create Custom Hooks
- **useSettings.js**: Settings state management with localStorage persistence
- **useSync.js**: Sync status and sync operations
- **useActivities.js**: Activities data fetching and management
- **usePeriod.js**: Period navigation and filtering logic

### Phase 5: Extract UI Components
1. **Header**: App title, sync status, settings button, refresh button
2. **PeriodNavigation**: Date navigation controls, view mode toggle
3. **SummaryCards**: Period statistics display
4. **ChartsSection**: All chart components
5. **RunCard**: Individual run display with expand/collapse
6. **WeeklyBreakdown**: Week grouping and display
7. **SettingsModal**: Settings configuration UI
8. **Loading**: Loading state component
9. **Error**: Error state component

### Phase 6: Refactor App.js
- Import and compose all extracted components
- Use custom hooks for state management
- Keep only high-level orchestration logic

## Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Testability**: Components and functions can be tested in isolation
3. **Reusability**: Components and hooks can be reused
4. **Discoverability**: Clear folder structure makes finding code easy
5. **Scalability**: Easy to add new features without bloating existing files
6. **Collaboration**: Multiple developers can work on different components simultaneously

## Best Practices Applied

- ✅ Single Responsibility Principle
- ✅ Separation of Concerns
- ✅ DRY (Don't Repeat Yourself)
- ✅ Component Composition
- ✅ Custom Hooks for Logic Reuse
- ✅ Service Layer Pattern
- ✅ Utility Functions for Pure Logic
- ✅ Feature-based Organization (where applicable)

## Migration Strategy

1. Create new folder structure
2. Extract utilities first (no dependencies)
3. Extract services (depends on constants)
4. Extract hooks (depends on services and utils)
5. Extract components (depends on hooks and utils)
6. Refactor App.js to use new structure
7. Test thoroughly
8. Remove old code

## Testing Considerations

- Each utility function should be unit testable
- Components should be testable with React Testing Library
- Hooks should be testable with @testing-library/react-hooks
- Services can be mocked for component testing

