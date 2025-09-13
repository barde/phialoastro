-- Grafana ClickHouse Debug Queries for Core Web Vitals
-- Use these queries in Grafana to debug data issues

-- 1. Check if ANY data exists in the table
SELECT count(*) as total_records
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 7 DAY;

-- 2. Check available metrics (should show LCP, INP, CLS, FCP, TTFB)
SELECT DISTINCT blob2 as metric_name, count(*) as count
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY blob2
ORDER BY count DESC;

-- 3. Check data freshness
SELECT
  max(timestamp) as latest_data,
  min(timestamp) as oldest_data,
  count(*) as total_records
FROM VITALS_ANALYTICS;

-- 4. Check the actual table structure
SELECT *
FROM VITALS_ANALYTICS
LIMIT 1;

-- 5. Test basic P75 calculation for LCP
SELECT
  quantileExact(0.75)(double1) AS lcp_p75_simple,
  count(*) as sample_count
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 24 HOUR
  AND blob2 = 'LCP';

-- 6. Check all available fields and their usage
SELECT
  count(DISTINCT blob1) as unique_pages,
  count(DISTINCT blob2) as unique_metrics,
  count(DISTINCT blob3) as unique_ratings,
  count(DISTINCT blob4) as unique_devices,
  count(DISTINCT blob5) as unique_browsers,
  count(DISTINCT blob6) as unique_connections,
  count(DISTINCT blob7) as unique_sessions
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 24 HOUR;

-- 7. Alternative query without _sample_interval (if that's the issue)
SELECT
  blob2 AS metric,
  quantileExact(0.75)(double1) AS p75_value,
  count(*) AS total_count
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY metric;

-- 8. Check if data is actually being written (by hour)
SELECT
  toStartOfHour(timestamp) AS hour,
  count(*) AS records_count
FROM VITALS_ANALYTICS
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour DESC;

-- 9. Simple test query for Grafana
SELECT
  now() as time,
  100 as test_value;

-- 10. Check the exact table name (case sensitive?)
SHOW TABLES LIKE '%VITALS%';