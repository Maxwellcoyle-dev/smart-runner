# API Example Requests

Here are some example API requests you can test:

## Health Check

```bash
curl http://localhost:3000/api/health
```

## Get Recent Daily Summaries

```bash
curl http://localhost:3000/api/daily-summaries?limit=10
```

## Get Daily Summaries for a Date Range

```bash
curl "http://localhost:3000/api/daily-summaries?startDate=2024-01-01&endDate=2024-01-31"
```

## Get Weekly Aggregated Summaries

```bash
curl "http://localhost:3000/api/daily-summaries/aggregated?groupBy=week&startDate=2024-01-01"
```

## Get Monthly Aggregated Summaries

```bash
curl "http://localhost:3000/api/daily-summaries/aggregated?groupBy=month"
```

## Get All Activities

```bash
curl http://localhost:3000/api/activities?limit=10
```

## Get Running Activities Only

```bash
curl "http://localhost:3000/api/activities?type=running&limit=10"
```

## Get Aggregated Activity Stats

```bash
curl "http://localhost:3000/api/activities/aggregated?startDate=2024-01-01"
```

## Get Specific Activity

```bash
curl http://localhost:3000/api/activities/8237785497
```

## Get Health Metrics

```bash
curl "http://localhost:3000/api/health-metrics?startDate=2024-01-01&endDate=2024-01-31"
```

## Get Specific Metric (Resting Heart Rate)

```bash
curl "http://localhost:3000/api/health-metrics?metric=restingHeartRate&startDate=2024-01-01"
```
