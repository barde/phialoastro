/**
 * Cloudflare Worker function to handle Core Web Vitals metrics
 * Receives metrics from the WebVitalsMonitor component
 * Stores data in KV or forwards to analytics service
 */

export async function onRequestPost({ request, env, ctx }) {
  try {
    // Parse the incoming metrics data
    const contentType = request.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Handle beacon API text/plain format
      const text = await request.text();
      data = JSON.parse(text);
    }

    const { metrics, context } = data;

    // Log metrics in development (Cloudflare Workers logs)
    if (env.ENVIRONMENT === 'development') {
      console.log('Received Web Vitals:', JSON.stringify({ metrics, context }, null, 2));
    }

    // Process each metric
    for (const metric of metrics) {
      // Calculate percentile bucket for aggregation
      const percentileBucket = getPercentileBucket(metric);
      
      // Prepare metric record
      const record = {
        ...metric,
        ...context,
        percentileBucket,
        timestamp: new Date().toISOString(),
        source: 'web-vitals-monitor'
      };

      // Store in KV for analysis (if KV namespace is configured)
      if (env.VITALS_STORE) {
        const key = `vitals:${context.sessionId}:${metric.name}:${Date.now()}`;
        await env.VITALS_STORE.put(key, JSON.stringify(record), {
          expirationTtl: 86400 * 30 // Keep for 30 days
        });
      }

      // Forward to analytics service if configured
      if (env.ANALYTICS_ENDPOINT) {
        ctx.waitUntil(
          fetch(env.ANALYTICS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.ANALYTICS_API_KEY}`
            },
            body: JSON.stringify(record)
          })
        );
      }

      // Track performance issues
      if (metric.rating === 'poor') {
        await trackPerformanceIssue(metric, context, env);
      }
    }

    // Return success response
    return new Response(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error processing web vitals:', error);
    
    // Return error but don't break the client
    return new Response(JSON.stringify({ error: 'Failed to process metrics' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Calculate percentile bucket for metric value
 */
function getPercentileBucket(metric) {
  const thresholds = {
    LCP: [2500, 4000], // Good, Needs Improvement, Poor
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800]
  };

  const threshold = thresholds[metric.name];
  if (!threshold) return 'unknown';

  if (metric.value <= threshold[0]) return 'p75_good';
  if (metric.value <= threshold[1]) return 'p75_needs_improvement';
  return 'p75_poor';
}

/**
 * Track performance issues for alerting
 */
async function trackPerformanceIssue(metric, context, env) {
  const issue = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: context.path,
    pageType: context.pageType,
    timestamp: new Date().toISOString(),
    attribution: metric.attribution
  };

  // Store in KV for analysis
  if (env.ISSUES_STORE) {
    const key = `issue:${metric.name}:${context.pageType}:${Date.now()}`;
    await env.ISSUES_STORE.put(key, JSON.stringify(issue), {
      expirationTtl: 86400 * 7 // Keep for 7 days
    });
  }

  // Could trigger alerts here if threshold exceeded
  // For example, send to Slack, email, etc.
}