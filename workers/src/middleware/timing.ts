import { WorkerContext } from '../types/worker';
import { logRequest, logResponse } from '../utils/logger';

/**
 * Timing middleware - tracks request duration and logs metrics
 */
export async function withTiming(
  context: WorkerContext,
  next: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  const { request } = context;
  
  // Log incoming request
  logRequest(request);
  
  try {
    // Execute next handler
    const response = await next();
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Add timing header
    const headers = new Headers(response.headers);
    headers.set('Server-Timing', `total;dur=${duration}`);
    
    // Log response
    logResponse(request, response, duration);
    
    // Return response with timing header
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    // Calculate duration even for errors
    const duration = Date.now() - startTime;
    
    // Re-throw error to be handled by error handler
    throw error;
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();
  
  /**
   * Record a metric
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }
  
  /**
   * Get metric statistics
   */
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Global metrics instance
export const metrics = new PerformanceMetrics();