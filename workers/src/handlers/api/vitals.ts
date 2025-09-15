/**
 * Web Vitals API Handler
 * Processes Core Web Vitals metrics and writes them to Cloudflare Analytics Engine
 */

import type { WorkerContext } from '../../types/worker';

/**
 * Analytics Engine field mappings for consistent schema
 * CRITICAL: blob2 MUST be the metric name for Grafana dashboard queries!
 */
// Direct array indexing is used - see writeMetricsToAnalytics function for mapping

const DOUBLE_FIELDS = {
  METRIC_VALUE: 0,
  TIMESTAMP: 1,
  VIEWPORT_WIDTH: 2,
  VIEWPORT_HEIGHT: 3,
  DELTA: 4,
} as const;

/**
 * Validate incoming vitals data
 */
function validateVitalsData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check for metrics batch
  if (data.metrics && Array.isArray(data.metrics)) {
    return data.metrics.every((metric: any) =>
      metric.name && typeof metric.value === 'number'
    );
  }

  // Check for single metric
  return data.name && typeof data.value === 'number';
}

/**
 * Get country from Cloudflare request object
 */
function getCountry(request: Request): string {
  // @ts-ignore - cf property exists on Cloudflare Workers
  return request.cf?.country || 'unknown';
}

/**
 * Process and write metrics to Analytics Engine
 */
async function writeMetricsToAnalytics(
  env: WorkerContext['env'],
  metrics: any[],
  request: Request
): Promise<void> {
  const country = getCountry(request);

  for (const metric of metrics) {
    try {
      // Prepare blob fields (dimensions)
      // IMPORTANT: blob2 MUST be metric name for dashboard queries to work!
      const blobs: string[] = new Array(8);
      blobs[0] = metric.path || '/';                        // blob1: URL path
      blobs[1] = metric.name || 'unknown';                  // blob2: METRIC NAME (LCP, FCP, etc.) - CRITICAL!
      blobs[2] = metric.sessionId || 'anonymous';           // blob3: Session ID
      blobs[3] = metric.speed || 'unknown';                 // blob4: Network type
      blobs[4] = metric.browser || 'unknown';               // blob5: Browser
      blobs[5] = metric.deviceType || 'unknown';            // blob6: Device type
      blobs[6] = country;                                   // blob7: Country
      blobs[7] = metric.language || 'de';                   // blob8: Language

      // Prepare double fields (numeric values)
      const doubles: number[] = new Array(5);
      doubles[DOUBLE_FIELDS.METRIC_VALUE] = metric.value || 0;
      doubles[DOUBLE_FIELDS.TIMESTAMP] = metric.timestamp || Date.now();
      doubles[DOUBLE_FIELDS.VIEWPORT_WIDTH] = metric.viewport?.width || 0;
      doubles[DOUBLE_FIELDS.VIEWPORT_HEIGHT] = metric.viewport?.height || 0;
      doubles[DOUBLE_FIELDS.DELTA] = metric.delta || 0;

      // Prepare indexes for querying (MUST match dashboard expectations)
      const indexes: string[] = [];
      indexes[0] = metric.name || 'unknown';  // index1: Metric name (LCP, FCP, etc.)
      indexes[1] = metric.rating || 'unknown'; // index2: Rating (good, needs-improvement, poor)
      indexes[2] = metric.path?.split('/')[1] || 'home'; // index3: Page type from URL
      indexes[3] = metric.language || 'de';    // index4: Language

      // Write to Analytics Engine (non-blocking)
      if (!env.VITALS_ANALYTICS) {
        console.error('[Analytics] ERROR: VITALS_ANALYTICS binding not found!');
        throw new Error('Analytics Engine binding not configured');
      }

      console.log(`[Analytics] Writing metric: ${metric.name} with value ${metric.value} to blob2`);
      console.log(`[Analytics] Full write - blob2: "${blobs[1]}", double1: ${doubles[0]}`);
      console.log(`[Analytics] Dataset name: VITALS_ANALYTICS`);

      try {
        env.VITALS_ANALYTICS.writeDataPoint({
          blobs,
          doubles,
          indexes,
        });
        console.log(`[Analytics] SUCCESS: Wrote ${metric.name} to Analytics Engine`);
      } catch (writeError) {
        console.error(`[Analytics] WRITE ERROR:`, writeError);
        throw writeError;
      }
    } catch (error) {
      console.error('Failed to write metric to Analytics Engine:', error);
    }
  }
}

/**
 * Handle Web Vitals API requests
 */
export async function handleVitals({ request, env }: WorkerContext): Promise<Response> {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Parse request body
    const contentType = request.headers.get('content-type');
    let data: any;

    if (contentType?.includes('text/plain')) {
      // Handle sendBeacon which sends as text/plain
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch {
        return new Response('Invalid JSON payload', { status: 400 });
      }
    } else {
      // Standard JSON request
      data = await request.json();
    }

    // Validate data
    if (!validateVitalsData(data)) {
      return new Response('Invalid vitals data', { status: 400 });
    }

    // Extract metrics array
    const metrics = data.metrics || [data];

    // Write metrics to Analytics Engine
    await writeMetricsToAnalytics(env, metrics, request);

    // Return success response
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error processing vitals request:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Handle preflight requests for CORS
 */
export async function handleVitalsOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}