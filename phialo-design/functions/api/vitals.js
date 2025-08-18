/**
 * Cloudflare Worker function to handle Core Web Vitals metrics
 * Sends metrics to Cloudflare Analytics Engine for analysis
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

    // Check if Analytics Engine is configured
    if (!env.VITALS_ANALYTICS) {
      console.error('Analytics Engine binding not configured');
      return new Response('Analytics Engine not configured', { 
        status: 503,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Process each metric and send to Analytics Engine
    for (const metric of metrics) {
      // Prepare data point for Analytics Engine
      const dataPoint = {
        // Indexes - used for filtering and grouping (limited to 20)
        indexes: [
          metric.name,                    // Metric name (LCP, INP, CLS, etc.)
          metric.rating,                   // Rating (good, needs-improvement, poor)
          context.pageType || 'unknown',  // Page type (home, portfolio, etc.)
          context.lang || 'unknown',      // Language (de, en)
        ],
        
        // Blobs - string data for additional context (limited to 20)
        blobs: [
          context.path || '',              // Full URL path
          context.sessionId || '',         // Session ID for correlation
          context.connection?.effectiveType || 'unknown', // Network type
          getUserAgent(request),           // User agent
          getDeviceType(context),          // Device type (mobile, desktop, tablet)
        ],
        
        // Doubles - numeric values for aggregation (limited to 20)
        doubles: [
          metric.value,                    // Metric value
          metric.delta || 0,               // Delta from previous value
          context.viewport?.width || 0,   // Viewport width
          context.viewport?.height || 0,  // Viewport height
          getTimestamp(),                  // Unix timestamp
        ]
      };

      // Add attribution data based on metric type
      if (metric.attribution) {
        switch (metric.name) {
          case 'LCP':
            // Add LCP-specific attribution
            dataPoint.doubles.push(
              metric.attribution.timeToFirstByte || 0,
              metric.attribution.resourceLoadDelay || 0,
              metric.attribution.resourceLoadDuration || 0,
              metric.attribution.elementRenderDelay || 0
            );
            dataPoint.blobs.push(
              truncateString(metric.attribution.element || '', 100),
              truncateString(metric.attribution.url || '', 100)
            );
            break;
            
          case 'CLS':
            // Add CLS-specific attribution
            dataPoint.doubles.push(
              metric.attribution.largestShiftValue || 0,
              metric.attribution.largestShiftTime || 0
            );
            dataPoint.blobs.push(
              truncateString(metric.attribution.largestShiftTarget || '', 100)
            );
            break;
            
          case 'INP':
            // Add INP-specific attribution
            dataPoint.doubles.push(
              metric.attribution.inputDelay || 0,
              metric.attribution.processingDuration || 0,
              metric.attribution.presentationDelay || 0,
              metric.attribution.eventTime || 0
            );
            dataPoint.blobs.push(
              metric.attribution.eventType || '',
              truncateString(metric.attribution.eventTarget || '', 100),
              metric.attribution.loadState || ''
            );
            break;
            
          case 'FCP':
            // Add FCP-specific attribution
            dataPoint.doubles.push(
              metric.attribution.timeToFirstByte || 0,
              metric.attribution.firstByteToFCP || 0
            );
            dataPoint.blobs.push(
              metric.attribution.loadState || ''
            );
            break;
            
          case 'TTFB':
            // Add TTFB-specific attribution
            dataPoint.doubles.push(
              metric.attribution.waitingDuration || 0,
              metric.attribution.dnsDuration || 0,
              metric.attribution.connectionDuration || 0,
              metric.attribution.requestDuration || 0
            );
            break;
        }
      }

      // Write data point to Analytics Engine
      env.VITALS_ANALYTICS.writeDataPoint(dataPoint);

      // Log in development
      if (env.ENVIRONMENT === 'development') {
        console.log(`[Analytics] ${metric.name}: ${metric.value} (${metric.rating})`);
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
 * Helper functions
 */

function getUserAgent(request) {
  const ua = request.headers.get('user-agent') || '';
  // Simplify user agent to key info
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function getDeviceType(context) {
  const width = context.viewport?.width || 0;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function truncateString(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}