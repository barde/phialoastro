# Test Queries for Grafana ClickHouse Connection

## 1. Test Connection (Simplest Query)
```sql
SELECT 1
```
If this returns `1`, your connection is working!

## 2. Check if Data Exists
```sql
SELECT count() as total
FROM VITALS_ANALYTICS
```

## 3. Get Raw Data Sample
```sql
SELECT *
FROM VITALS_ANALYTICS
LIMIT 5
```

## 4. Get Metrics List
```sql
SELECT
  blob2 as metric_name,
  count() as count
FROM VITALS_ANALYTICS
GROUP BY blob2
```

## 5. Simple LCP Query (ClickHouse Syntax)
```sql
SELECT
  quantileWeighted(0.75)(double1, _sample_interval) AS lcp_p75
FROM VITALS_ANALYTICS
WHERE
  timestamp >= now() - INTERVAL 1 HOUR
  AND blob2 = 'LCP'
```

## Common Issues and Solutions

### "No Data" in Dashboard
1. **Wrong Query Syntax**: ClickHouse uses different function syntax than standard SQL
   - Use `quantileWeighted(0.75)(value, weight)` not `quantileWeighted(0.75, value, weight)`
   - Use `now()` not `NOW()`
   - Use `sum(if(condition, value, 0))` not `CASE WHEN`

2. **Time Range Issues**:
   - Make sure you have data in the selected time range
   - Use `timestamp >= now() - INTERVAL 1 DAY` format

3. **Field Names**:
   - blob1: URL
   - blob2: Metric name (LCP, INP, CLS, FCP, TTFB)
   - blob3: Rating (good, needs-improvement, poor)
   - blob4: Device type
   - double1: Metric value
   - double2: Timestamp in milliseconds

### Dashboard Import Steps
1. Go to Dashboards → Import
2. Upload `grafana-dashboard-clickhouse.json`
3. Select your ClickHouse data source
4. Click Import

### Manual Panel Creation
If import doesn't work, create panels manually with these queries:

**LCP Stat Panel:**
```sql
SELECT
  quantileWeighted(0.75)(double1, _sample_interval) AS value
FROM VITALS_ANALYTICS
WHERE
  timestamp >= now() - INTERVAL 1 HOUR
  AND blob2 = 'LCP'
```

**Time Series (All Metrics):**
```sql
SELECT
  toStartOfHour(toDateTime(double2 / 1000)) AS time,
  blob2 AS metric,
  quantileWeighted(0.75)(double1, _sample_interval) AS value
FROM VITALS_ANALYTICS
WHERE
  timestamp >= now() - INTERVAL 7 DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY time, metric
ORDER BY time
```