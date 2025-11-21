# Training Progress Dashboard - Design Proposal

## Current Issues
1. ❌ Shows all running history at once - overwhelming and not actionable
2. ❌ No time-based organization (month/week breakdown)
3. ❌ No visual progress tracking (graphs/charts)
4. ❌ Hard to compare periods or see trends
5. ❌ Not optimized for training planning and progress tracking

## Proposed Layout

### 1. **Top Navigation Bar**
```
[← Previous] [Current Month: November 2024] [Next →]  [Week View] [Month View] [⚙️] [Sync]
```

**Features:**
- Easy navigation between months/weeks
- Toggle between Week and Month view
- Quick access to settings and sync
- Shows current period context

### 2. **Main Dashboard - Month View**

#### **A. Period Summary Cards (Top Row)**
Four key metric cards for the selected month:
- **Total Distance** - with trend indicator (↑↓) vs previous month
- **Total Runs** - frequency tracking
- **Total Time** - training volume
- **Average Pace** - performance indicator

#### **B. Progress Charts Section**
Two-column layout with interactive graphs:
- **Distance Over Time** (line chart) - daily/weekly distance trends
- **Pace Trends** (line chart) - average pace per run over time
- **Heart Rate Zones** (stacked area chart) - training intensity distribution
- **Weekly Volume Comparison** (bar chart) - compare weeks within month

#### **C. Weekly Breakdown**
Collapsible sections for each week in the month:
```
Week 1 (Nov 1-7) [▼]
  └─ Summary: 3 runs, 15.2 km, 2:15:00
  └─ Runs: [List of runs with key metrics]

Week 2 (Nov 8-14) [▶]
Week 3 (Nov 15-21) [▶]
Week 4 (Nov 22-28) [▶]
```

### 3. **Main Dashboard - Week View**

#### **A. Week Summary Cards**
- Total Distance
- Number of Runs
- Average Pace
- Training Load (intensity score)

#### **B. Weekly Chart**
- Daily distance/pace breakdown
- Training pattern visualization

#### **C. Individual Runs**
- Detailed list of runs for the week
- Expandable splits (as currently implemented)

### 4. **Sidebar/Secondary Section** (Optional)
- **Trend Indicators**: 
  - "This month: +12% distance vs last month"
  - "Average pace improving: -5 seconds/km"
- **Training Insights**:
  - "Consistency: 4 runs/week average"
  - "Peak week: Week 2 with 25km"
- **Quick Stats**:
  - Longest run this month
  - Fastest pace this month
  - Best week for volume

## Key Features to Implement

### 1. **Time Period Management**
- State: `currentView` ('week' | 'month')
- State: `selectedDate` (Date object for current period)
- Functions: `getWeekStart(date)`, `getMonthStart(date)`, `navigatePeriod(direction)`

### 2. **Data Aggregation**
- Backend endpoints already support `startDate`/`endDate` filtering
- Need to add week/month grouping for running activities
- Calculate period comparisons (current vs previous)

### 3. **Visualizations** (Consider using a charting library)
- **recharts** or **Chart.js** for React
- Key charts:
  - Distance over time (line)
  - Pace trends (line)
  - Weekly volume comparison (bar)
  - Heart rate zones (stacked area)
  - Training frequency (calendar heatmap)

### 4. **Training Metrics**
Focus on metrics that matter for training:
- **Volume**: Total distance, time, runs per week
- **Intensity**: Average pace, heart rate zones, training effect
- **Consistency**: Runs per week, weekly volume variance
- **Progress**: Pace improvement, distance progression, HR trends

### 5. **Navigation UX**
- Smooth transitions between periods
- Loading states during data fetch
- Cached data for quick navigation
- URL params for shareable links (e.g., `/dashboard?view=month&date=2024-11`)

## Implementation Priority

### Phase 1: Core Structure
1. ✅ Period navigation (month/week toggle, date picker)
2. ✅ Data fetching by period (update API calls with date filters)
3. ✅ Period summary cards
4. ✅ Weekly breakdown in month view

### Phase 2: Visualizations
1. ✅ Install charting library (recharts recommended)
2. ✅ Distance over time chart
3. ✅ Pace trends chart
4. ✅ Weekly volume comparison

### Phase 3: Advanced Features
1. ✅ Period comparisons (current vs previous)
2. ✅ Training insights/trends
3. ✅ Calendar heatmap for training frequency
4. ✅ Export/print functionality

### Phase 4: AI Planning Integration
1. ✅ Training load analysis
2. ✅ Recovery recommendations
3. ✅ Next week/month suggestions
4. ✅ Goal tracking and progress

## UI/UX Improvements

### Color Scheme
- Use color coding for intensity zones
- Green for improvements, red for declines
- Consistent color palette for charts

### Responsive Design
- Mobile: Stack cards vertically, simplified charts
- Tablet: 2-column layout
- Desktop: Full 3-column with sidebar

### Interactions
- Hover states on charts show detailed tooltips
- Click on week to expand/collapse
- Click on chart data point to see related runs
- Smooth animations for period transitions

## Technical Considerations

### State Management
```javascript
const [viewMode, setViewMode] = useState('month'); // 'week' | 'month'
const [selectedDate, setSelectedDate] = useState(new Date());
const [monthData, setMonthData] = useState(null);
const [weekData, setWeekData] = useState(null);
const [comparisonData, setComparisonData] = useState(null);
```

### API Calls
- `/api/running/stats?startDate=2024-11-01&endDate=2024-11-30` for month
- `/api/running?startDate=2024-11-01&endDate=2024-11-30&limit=100` for activities
- Need new endpoint: `/api/running/weekly` or `/api/running/monthly` for grouped data

### Performance
- Lazy load charts (only render when visible)
- Cache period data
- Debounce date navigation
- Virtual scrolling for long activity lists

