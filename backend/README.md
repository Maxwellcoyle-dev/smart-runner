# Garmin Data Backend API

Backend API for aggregating and serving Garmin fitness data to the React frontend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Health Check

- **GET** `/api/health`
  - Returns server status

### Daily Summaries

- **GET** `/api/daily-summaries`

  - Get daily summary data
  - Query parameters:
    - `startDate` (optional): Filter from date (YYYY-MM-DD)
    - `endDate` (optional): Filter to date (YYYY-MM-DD)
    - `limit` (optional): Limit number of results
  - Example: `/api/daily-summaries?startDate=2024-01-01&endDate=2024-01-31&limit=30`

- **GET** `/api/daily-summaries/aggregated`
  - Get aggregated daily summary statistics
  - Query parameters:
    - `startDate` (optional): Filter from date (YYYY-MM-DD)
    - `endDate` (optional): Filter to date (YYYY-MM-DD)
    - `groupBy` (optional): `day`, `week`, or `month` (default: overall aggregation)
  - Example: `/api/daily-summaries/aggregated?groupBy=week&startDate=2024-01-01`

### Activities

- **GET** `/api/activities`

  - Get activity data
  - Query parameters:
    - `type` (optional): Filter by activity type (e.g., "running", "cycling")
    - `startDate` (optional): Filter from date
    - `endDate` (optional): Filter to date
    - `limit` (optional): Limit number of results
  - Example: `/api/activities?type=running&limit=10`

- **GET** `/api/activities/aggregated`

  - Get aggregated activity statistics
  - Query parameters:
    - `type` (optional): Filter by activity type
    - `startDate` (optional): Filter from date
    - `endDate` (optional): Filter to date
  - Returns: Total distance, duration, calories, averages, and breakdown by activity type

- **GET** `/api/activities/:id`
  - Get specific activity by ID
  - Example: `/api/activities/8237785497`

### Health Metrics

- **GET** `/api/health-metrics`
  - Get health metrics (steps, heart rate, stress, body battery, etc.)
  - Query parameters:
    - `metric` (optional): Specific metric name (e.g., "totalSteps", "restingHeartRate")
    - `startDate` (optional): Filter from date
    - `endDate` (optional): Filter to date
  - Example: `/api/health-metrics?metric=restingHeartRate&startDate=2024-01-01`

## Data Sources

The API reads from:

- JSON files in `../data/FitFiles/Monitoring/` for daily summaries
- JSON files in `../data/FitFiles/Activities/` for activities
- SQLite database at `../data/DBs/garmin_monitoring.db` (for future use)

## Response Format

All endpoints return JSON with the following structure:

```json
{
  "count": 10,
  "data": [...]
}
```

Aggregated endpoints may have different structures based on the aggregation type.
