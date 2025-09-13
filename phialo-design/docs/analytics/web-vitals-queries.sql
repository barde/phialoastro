-- Cloudflare Analytics Engine Queries for Core Web Vitals
-- Use these queries in the Cloudflare Dashboard or via SQL API

-- ============================================================================
-- FIELD MAPPINGS
-- ============================================================================
-- Blobs (Dimensions):
--   blob1: URL path
--   blob2: Metric name (LCP, INP, CLS, FCP, TTFB)
--   blob3: Rating (good, needs-improvement, poor)
--   blob4: Device type (mobile, tablet, desktop)
--   blob5: Connection type (4g, 3g, wifi, etc.)
--   blob6: Browser (Chrome, Safari, Firefox, Edge)
--   blob7: Country code
--   blob8: Language (de, en)
--   blob9: Referrer

-- Doubles (Metrics):
--   double1: Metric value (milliseconds for LCP/INP/FCP/TTFB, score for CLS)
--   double2: Timestamp
--   double3: Viewport width
--   double4: Viewport height
--   double5: Delta value

-- Indexes:
--   index1: Session ID

-- ============================================================================
-- CORE WEB VITALS SUMMARY (P75)
-- ============================================================================
-- Get the 75th percentile for all Core Web Vitals (Google's threshold)
SELECT
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  quantileWeighted(0.50, double1, _sample_interval) AS p50_value,
  quantileWeighted(0.95, double1, _sample_interval) AS p95_value,
  COUNT(*) * _sample_interval AS total_samples,
  CASE
    WHEN blob2 = 'LCP' AND quantileWeighted(0.75, double1, _sample_interval) <= 2500 THEN 'Good'
    WHEN blob2 = 'LCP' AND quantileWeighted(0.75, double1, _sample_interval) <= 4000 THEN 'Needs Improvement'
    WHEN blob2 = 'LCP' THEN 'Poor'
    WHEN blob2 = 'INP' AND quantileWeighted(0.75, double1, _sample_interval) <= 200 THEN 'Good'
    WHEN blob2 = 'INP' AND quantileWeighted(0.75, double1, _sample_interval) <= 500 THEN 'Needs Improvement'
    WHEN blob2 = 'INP' THEN 'Poor'
    WHEN blob2 = 'CLS' AND quantileWeighted(0.75, double1, _sample_interval) <= 0.1 THEN 'Good'
    WHEN blob2 = 'CLS' AND quantileWeighted(0.75, double1, _sample_interval) <= 0.25 THEN 'Needs Improvement'
    WHEN blob2 = 'CLS' THEN 'Poor'
    WHEN blob2 = 'FCP' AND quantileWeighted(0.75, double1, _sample_interval) <= 1800 THEN 'Good'
    WHEN blob2 = 'FCP' AND quantileWeighted(0.75, double1, _sample_interval) <= 3000 THEN 'Needs Improvement'
    WHEN blob2 = 'FCP' THEN 'Poor'
    WHEN blob2 = 'TTFB' AND quantileWeighted(0.75, double1, _sample_interval) <= 800 THEN 'Good'
    WHEN blob2 = 'TTFB' AND quantileWeighted(0.75, double1, _sample_interval) <= 1800 THEN 'Needs Improvement'
    ELSE 'Poor'
  END AS performance_rating
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')
GROUP BY metric_name
ORDER BY metric_name;

-- ============================================================================
-- PERFORMANCE BY PAGE (TOP 10 WORST PERFORMING)
-- ============================================================================
SELECT
  blob1 AS page_url,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS page_views
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '24' HOUR
  AND blob2 = 'LCP'  -- Change to INP, CLS, FCP, or TTFB as needed
GROUP BY page_url, metric_name
ORDER BY p75_value DESC
LIMIT 10;

-- ============================================================================
-- PERFORMANCE BY DEVICE TYPE
-- ============================================================================
SELECT
  blob4 AS device_type,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  quantileWeighted(0.50, double1, _sample_interval) AS p50_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY device_type, metric_name
ORDER BY device_type, metric_name;

-- ============================================================================
-- PERFORMANCE BY COUNTRY
-- ============================================================================
SELECT
  blob7 AS country,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '30' DAY
  AND blob2 = 'LCP'
GROUP BY country, metric_name
HAVING COUNT(*) * _sample_interval > 100  -- Only show countries with significant traffic
ORDER BY p75_value DESC
LIMIT 20;

-- ============================================================================
-- TIME SERIES ANALYSIS (HOURLY)
-- ============================================================================
SELECT
  toStartOfHour(toDateTime(double2 / 1000)) AS hour,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  quantileWeighted(0.50, double1, _sample_interval) AS p50_value,
  COUNT(*) * _sample_interval AS samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '24' HOUR
  AND blob2 = 'LCP'
GROUP BY hour, metric_name
ORDER BY hour DESC;

-- ============================================================================
-- PERFORMANCE BY CONNECTION TYPE
-- ============================================================================
SELECT
  blob5 AS connection_type,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP')
  AND blob5 != 'unknown'
GROUP BY connection_type, metric_name
ORDER BY connection_type, metric_name;

-- ============================================================================
-- CORE WEB VITALS PASS RATE
-- ============================================================================
SELECT
  blob2 AS metric_name,
  SUM(CASE WHEN blob3 = 'good' THEN _sample_interval ELSE 0 END) /
    SUM(_sample_interval) * 100 AS good_percentage,
  SUM(CASE WHEN blob3 = 'needs-improvement' THEN _sample_interval ELSE 0 END) /
    SUM(_sample_interval) * 100 AS needs_improvement_percentage,
  SUM(CASE WHEN blob3 = 'poor' THEN _sample_interval ELSE 0 END) /
    SUM(_sample_interval) * 100 AS poor_percentage,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY metric_name;

-- ============================================================================
-- BROWSER PERFORMANCE COMPARISON
-- ============================================================================
SELECT
  blob6 AS browser,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 = 'LCP'
  AND blob6 != 'unknown'
GROUP BY browser, metric_name
HAVING COUNT(*) * _sample_interval > 50
ORDER BY p75_value ASC;

-- ============================================================================
-- VIEWPORT SIZE ANALYSIS
-- ============================================================================
SELECT
  CASE
    WHEN double3 < 768 THEN 'Mobile (<768px)'
    WHEN double3 < 1024 THEN 'Tablet (768-1024px)'
    ELSE 'Desktop (>1024px)'
  END AS viewport_category,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  AVG(double3) AS avg_width,
  AVG(double4) AS avg_height,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 = 'LCP'
GROUP BY viewport_category, metric_name
ORDER BY viewport_category;

-- ============================================================================
-- REFERRER PERFORMANCE ANALYSIS
-- ============================================================================
SELECT
  blob9 AS referrer_source,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '30' DAY
  AND blob2 = 'LCP'
  AND blob9 != 'direct'
GROUP BY referrer_source, metric_name
HAVING COUNT(*) * _sample_interval > 10
ORDER BY total_samples DESC
LIMIT 20;

-- ============================================================================
-- LANGUAGE-SPECIFIC PERFORMANCE
-- ============================================================================
SELECT
  blob8 AS language,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY language, metric_name
ORDER BY language, metric_name;

-- ============================================================================
-- PERFORMANCE TREND (WEEK OVER WEEK)
-- ============================================================================
SELECT
  CASE
    WHEN timestamp >= NOW() - INTERVAL '7' DAY THEN 'This Week'
    ELSE 'Last Week'
  END AS week_period,
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE
  timestamp >= NOW() - INTERVAL '14' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY week_period, metric_name
ORDER BY metric_name, week_period DESC;