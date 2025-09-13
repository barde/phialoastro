/**
 * Web Vitals Collection Utility
 * Handles client-side collection and batching of Core Web Vitals metrics
 */

import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals';
import type {
  AnalyticsPayload,
  ConnectionType,
  DeviceType,
  MetricsBatch,
  WebVitalsConfig,
  WebVitalsMetricName,
} from '@/shared/types/vitals';

/**
 * Web Vitals Reporter class for efficient batching and transmission
 */
export class WebVitalsReporter {
  private queue: Set<AnalyticsPayload> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly config: Required<WebVitalsConfig>;
  private readonly sessionId: string;

  // Default configuration
  private static readonly DEFAULT_CONFIG: Required<WebVitalsConfig> = {
    endpoint: '/api/vitals',
    sampling: 0.1, // 10% sampling by default
    reportAllChanges: false,
    durationThreshold: 40,
    debug: false,
    enableAttribution: false,
  };

  // Batching configuration
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  constructor(config: WebVitalsConfig = {}) {
    this.config = { ...WebVitalsReporter.DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();

    // Set up page unload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flush(), { once: true });
      window.addEventListener('beforeunload', () => this.flush(), { once: true });
    }
  }

  /**
   * Initialize Web Vitals tracking
   */
  public init(): void {
    // Check if we should track this session (sampling)
    if (!this.shouldSample()) {
      if (this.config.debug) {
        console.log('[WebVitals] Session not sampled, skipping tracking');
      }
      return;
    }

    // Check for analytics consent if needed
    if (!this.isAnalyticsEnabled()) {
      if (this.config.debug) {
        console.log('[WebVitals] Analytics not enabled, skipping tracking');
      }
      return;
    }

    // Initialize metric collection
    const options = {
      reportAllChanges: this.config.reportAllChanges,
      durationThreshold: this.config.durationThreshold,
    };

    // Register metric callbacks
    onLCP((metric) => this.handleMetric(metric), options);
    onINP((metric) => this.handleMetric(metric), options);
    onCLS((metric) => this.handleMetric(metric), options);
    onFCP((metric) => this.handleMetric(metric), options);
    onTTFB((metric) => this.handleMetric(metric), options);

    if (this.config.debug) {
      console.log('[WebVitals] Initialized with config:', this.config);
    }
  }

  /**
   * Handle a metric from web-vitals library
   */
  private handleMetric(metric: Metric): void {
    const payload = this.createPayload(metric);
    this.addToQueue(payload);

    if (this.config.debug) {
      console.log(`[WebVitals] ${metric.name}:`, metric.value, metric.rating);
    }
  }

  /**
   * Create analytics payload from metric
   */
  private createPayload(metric: Metric): AnalyticsPayload {
    return {
      // Core metric data
      name: metric.name as WebVitalsMetricName,
      value: metric.value,
      id: metric.id,
      rating: metric.rating || 'poor',
      delta: metric.delta,
      navigationType: metric.navigationType,

      // Context data
      path: window.location.pathname,
      speed: this.getConnectionType(),
      deviceType: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      country: undefined, // Will be added server-side
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      sessionId: this.sessionId,
      timestamp: Date.now(),
      referrer: document.referrer || 'direct',
      language: document.documentElement.lang || 'de',

      // Attribution data if enabled
      ...(this.config.enableAttribution && metric.attribution
        ? { attribution: metric.attribution }
        : {}),
    };
  }

  /**
   * Add metric to queue and manage batching
   */
  private addToQueue(metric: AnalyticsPayload): void {
    this.queue.add(metric);

    // Flush if batch size reached
    if (this.queue.size >= this.BATCH_SIZE) {
      this.flush();
    } else if (!this.batchTimer) {
      // Set timer for batch timeout
      this.batchTimer = setTimeout(() => this.flush(), this.BATCH_TIMEOUT);
    }
  }

  /**
   * Flush the queue and send metrics
   */
  public flush(): void {
    if (this.queue.size === 0) return;

    const metrics = Array.from(this.queue);
    this.queue.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch: MetricsBatch = {
      metrics,
      context: this.getContext(),
    };

    this.sendMetrics(batch);
  }

  /**
   * Send metrics to the server
   */
  private sendMetrics(batch: MetricsBatch): void {
    const payload = JSON.stringify(batch);

    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.config.endpoint, payload);
      if (this.config.debug) {
        console.log('[WebVitals] Sent via sendBeacon:', success);
      }
    } else {
      // Fallback to fetch with keepalive
      fetch(this.config.endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch((error) => {
        if (this.config.debug) {
          console.error('[WebVitals] Failed to send metrics:', error);
        }
      });
    }
  }

  /**
   * Get current context information
   */
  private getContext(): MetricsBatch['context'] {
    return {
      url: window.location.pathname,
      language: document.documentElement.lang || 'de',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: this.getConnectionType(),
      timestamp: Date.now(),
    };
  }

  /**
   * Check if session should be sampled
   */
  private shouldSample(): boolean {
    // Use sessionId for consistent sampling decision
    const hash = this.hashCode(this.sessionId);
    return (Math.abs(hash) % 100) / 100 < this.config.sampling;
  }

  /**
   * Check if analytics is enabled
   */
  private isAnalyticsEnabled(): boolean {
    // Don't track on localhost unless in debug mode
    if (window.location.hostname === 'localhost' && !this.config.debug) {
      return false;
    }

    // Check for user consent if needed (GDPR)
    // Note: Cloudflare Analytics doesn't require consent as it's privacy-preserving
    // But we respect any explicit opt-out
    const optOut = localStorage.getItem('analytics-opt-out');
    if (optOut === 'true') {
      return false;
    }

    return true;
  }

  /**
   * Get connection type
   */
  private getConnectionType(): ConnectionType {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) return 'unknown';

    if (connection.effectiveType) {
      return connection.effectiveType as ConnectionType;
    }

    return 'unknown';
  }

  /**
   * Get device type based on viewport
   */
  private getDeviceType(): DeviceType {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple hash function for consistent sampling
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

/**
 * Singleton instance for easy usage
 */
let reporterInstance: WebVitalsReporter | null = null;

/**
 * Initialize Web Vitals tracking with configuration
 */
export function initWebVitals(config?: WebVitalsConfig): void {
  if (!reporterInstance) {
    reporterInstance = new WebVitalsReporter(config);
    reporterInstance.init();
  }
}

/**
 * Manually flush metrics (useful for SPA navigation)
 */
export function flushWebVitals(): void {
  if (reporterInstance) {
    reporterInstance.flush();
  }
}

/**
 * Export for testing purposes
 */
export { WebVitalsReporter as __WebVitalsReporter };