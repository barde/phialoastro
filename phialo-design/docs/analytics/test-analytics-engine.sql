-- Test queries for Cloudflare Analytics Engine
-- Use these in Grafana with the ClickHouse datasource

-- 1. Simple test to verify datasource connection
SELECT 1 as test;

-- 2. Check if the VITALS_ANALYTICS table exists (may need adjustment based on actual table name)
-- Try variations like: vitals_analytics, analytics_engine_vitals, etc.
SELECT * FROM system.tables WHERE name LIKE '%vitals%' OR name LIKE '%VITALS%';

-- 3. If table exists with different name, check its structure
DESCRIBE TABLE vitals_analytics;

-- 4. Test without _sample_interval (simpler query)
SELECT
  blob2 as metric_name,
  count(*) as count,
  avg(double1) as avg_value,
  max(double1) as max_value,
  min(double1) as min_value
FROM vitals_analytics
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY metric_name;

-- 5. Alternative table names to try
-- Analytics Engine might use different naming conventions
SELECT * FROM analytics_engine LIMIT 1;
SELECT * FROM web_vitals LIMIT 1;
SELECT * FROM metrics LIMIT 1;

-- 6. Check Cloudflare Analytics Engine specific format
-- blob1-blob9 for dimensions, double1-double9 for metrics
SELECT
  blob1 as url,
  blob2 as metric,
  blob3 as rating,
  blob4 as device,
  blob5 as browser,
  double1 as value,
  double2 as timestamp_ms,
  count(*) as samples
FROM vitals_analytics
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY blob1, blob2, blob3, blob4, blob5, double1, double2
LIMIT 10;

-- 7. Working query for the Grafana dashboard (simplified)
SELECT
  blob2 AS metric_name,
  avg(double1) AS avg_value,
  count(*) AS sample_count
FROM vitals_analytics
WHERE timestamp >= toDateTime(now() - 3600)
GROUP BY metric_name;