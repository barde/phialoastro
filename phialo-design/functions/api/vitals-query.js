/**
 * Query Analytics Engine for Web Vitals data
 * Provides a simple API to retrieve performance metrics
 */

export async function onRequestGet({ request, env }) {
  // This endpoint requires API credentials to be configured
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({
        error: 'Analytics API not configured',
        setup: 'Add CF_API_TOKEN and CF_ACCOUNT_ID as Worker secrets'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const url = new URL(request.url);
  const metric = url.searchParams.get('metric'); // Optional: filter by metric
  const hours = parseInt(url.searchParams.get('hours') || '24');
  const pageType = url.searchParams.get('pageType'); // Optional: filter by page type

  try {
    // Build the SQL query
    let query = `
      SELECT 
        index1 as metric_name,
        index2 as rating,
        index3 as page_type,
        index4 as language,
        blob5 as device_type,
        COUNT(*) as count,
        AVG(double1) as avg_value,
        APPROX_QUANTILE(double1, 0.50) as p50,
        APPROX_QUANTILE(double1, 0.75) as p75,
        APPROX_QUANTILE(double1, 0.90) as p90,
        APPROX_QUANTILE(double1, 0.99) as p99,
        MIN(double1) as min_value,
        MAX(double1) as max_value
      FROM VITALS_ANALYTICS
      WHERE timestamp >= NOW() - INTERVAL '${hours}' HOUR
    `;

    // Add filters if provided
    if (metric) {
      query += ` AND index1 = '${metric}'`;
    }
    if (pageType) {
      query += ` AND index3 = '${pageType}'`;
    }

    query += `
      GROUP BY index1, index2, index3, index4, blob5
      ORDER BY count DESC
    `;

    // Execute the query
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Analytics Engine query failed:', error);
      return new Response(
        JSON.stringify({ error: 'Query failed', details: error }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await response.json();

    // Process and structure the data
    const summary = processMetricsData(result.data || []);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });

  } catch (error) {
    console.error('Error querying Analytics Engine:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Process raw metrics data into a structured summary
 */
function processMetricsData(rows) {
  const metrics = {};
  const thresholds = {
    LCP: { good: 2500, poor: 4000, unit: 'ms' },
    INP: { good: 200, poor: 500, unit: 'ms' },
    CLS: { good: 0.1, poor: 0.25, unit: '' },
    FCP: { good: 1800, poor: 3000, unit: 'ms' },
    TTFB: { good: 800, poor: 1800, unit: 'ms' }
  };

  // Group data by metric
  rows.forEach(row => {
    const metricName = row.metric_name;
    
    if (!metrics[metricName]) {
      metrics[metricName] = {
        name: metricName,
        unit: thresholds[metricName]?.unit || 'ms',
        thresholds: thresholds[metricName] || {},
        summary: {
          total: 0,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
          percentiles: { p50: null, p75: null, p90: null, p99: null },
          avg: null,
          min: null,
          max: null
        },
        breakdown: {
          byPageType: {},
          byDevice: {},
          byLanguage: {}
        }
      };
    }

    const metric = metrics[metricName];
    
    // Update totals
    metric.summary.total += row.count;
    metric.summary.ratings[row.rating] = (metric.summary.ratings[row.rating] || 0) + row.count;

    // Update percentiles (weighted average)
    if (row.rating === 'good' || metric.summary.percentiles.p75 === null) {
      metric.summary.percentiles.p50 = row.p50;
      metric.summary.percentiles.p75 = row.p75;
      metric.summary.percentiles.p90 = row.p90;
      metric.summary.percentiles.p99 = row.p99;
      metric.summary.avg = row.avg_value;
      metric.summary.min = row.min_value;
      metric.summary.max = row.max_value;
    }

    // Add breakdowns
    if (row.page_type && row.page_type !== 'unknown') {
      if (!metric.breakdown.byPageType[row.page_type]) {
        metric.breakdown.byPageType[row.page_type] = { 
          count: 0, 
          p75: row.p75,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 }
        };
      }
      metric.breakdown.byPageType[row.page_type].count += row.count;
      metric.breakdown.byPageType[row.page_type].ratings[row.rating] += row.count;
    }

    if (row.device_type) {
      if (!metric.breakdown.byDevice[row.device_type]) {
        metric.breakdown.byDevice[row.device_type] = { 
          count: 0, 
          p75: row.p75,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 }
        };
      }
      metric.breakdown.byDevice[row.device_type].count += row.count;
      metric.breakdown.byDevice[row.device_type].ratings[row.rating] += row.count;
    }

    if (row.language) {
      if (!metric.breakdown.byLanguage[row.language]) {
        metric.breakdown.byLanguage[row.language] = { 
          count: 0, 
          p75: row.p75,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 }
        };
      }
      metric.breakdown.byLanguage[row.language].count += row.count;
      metric.breakdown.byLanguage[row.language].ratings[row.rating] += row.count;
    }
  });

  // Calculate percentages and scores
  Object.values(metrics).forEach(metric => {
    const total = metric.summary.total;
    if (total > 0) {
      metric.summary.score = (metric.summary.ratings.good / total * 100).toFixed(1);
      metric.summary.distribution = {
        good: ((metric.summary.ratings.good / total) * 100).toFixed(1),
        needsImprovement: ((metric.summary.ratings['needs-improvement'] / total) * 100).toFixed(1),
        poor: ((metric.summary.ratings.poor / total) * 100).toFixed(1)
      };
    }
  });

  return {
    timestamp: new Date().toISOString(),
    metrics,
    totalSamples: rows.reduce((sum, row) => sum + row.count, 0)
  };
}