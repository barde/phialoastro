/**
 * Core Web Vitals type definitions
 * Based on web-vitals v5.1.0 library
 */

/**
 * Core Web Vitals metric names
 * INP replaced FID as a Core Web Vital in March 2024
 */
export type WebVitalsMetricName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

/**
 * Performance rating based on Google's thresholds
 */
export type WebVitalsRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Device type classification
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Network connection types
 */
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';

/**
 * Web Vitals metric data structure from web-vitals library
 */
export interface WebVitalsMetric {
  name: WebVitalsMetricName;
  value: number;
  id: string;
  rating: WebVitalsRating;
  delta?: number;
  navigationType?: 'navigate' | 'reload' | 'back-forward' | 'prerender';
  attribution?: Record<string, any>;
}

/**
 * Enhanced analytics payload with context
 */
export interface AnalyticsPayload extends WebVitalsMetric {
  path: string;
  speed: ConnectionType;
  deviceType: DeviceType;
  browser?: string;
  country?: string;
  viewport?: {
    width: number;
    height: number;
  };
  sessionId?: string;
  timestamp: number;
  referrer?: string;
  language?: string;
}

/**
 * Batch of metrics for efficient transmission
 */
export interface MetricsBatch {
  metrics: AnalyticsPayload[];
  context: {
    url: string;
    language: string;
    viewport: string;
    connection: ConnectionType;
    timestamp: number;
  };
}

/**
 * Analytics Engine data point structure
 */
export interface AnalyticsEngineDataPoint {
  blobs: string[];    // Dimensions for grouping/filtering
  doubles: number[];  // Numeric metrics
  indexes: string[];  // Sampling key (single value only)
}

/**
 * Web Vitals thresholds based on Google's recommendations
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },    // Milliseconds
  INP: { good: 200, poor: 500 },      // Milliseconds
  CLS: { good: 0.1, poor: 0.25 },     // Score
  FCP: { good: 1800, poor: 3000 },    // Milliseconds
  TTFB: { good: 800, poor: 1800 },    // Milliseconds
} as const;

/**
 * Configuration for Web Vitals collection
 */
export interface WebVitalsConfig {
  endpoint?: string;
  sampling?: number;        // 0.0 to 1.0 (percentage of users to track)
  reportAllChanges?: boolean;
  durationThreshold?: number;
  debug?: boolean;
  enableAttribution?: boolean;
}

/**
 * Helper function to determine rating based on thresholds
 */
export function getMetricRating(name: WebVitalsMetricName, value: number): WebVitalsRating {
  const threshold = WEB_VITALS_THRESHOLDS[name];
  if (!threshold) return 'poor';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Helper function to get device type based on viewport width
 */
export function getDeviceType(width: number = window.innerWidth): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Helper function to get connection type
 */
export function getConnectionType(): ConnectionType {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return 'unknown';

  // Check for explicit connection type
  if (connection.effectiveType) {
    return connection.effectiveType as ConnectionType;
  }

  // Fallback to unknown
  return 'unknown';
}