/**
 * BrowserStack Test Distribution Utilities
 * Optimizes test execution across 5 parallel sessions
 */

import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Test execution metrics for intelligent distribution
 */
interface TestMetrics {
  name: string;
  averageTime: number;
  lastRunTime?: number;
  failureRate: number;
  browser?: string;
}

/**
 * Browser configuration for BrowserStack
 */
interface BrowserConfig {
  name: string;
  capability: any;
  priority: number;
  testAffinity?: string[]; // Tests that work better on this browser
}

/**
 * Shard configuration for parallel execution
 */
interface ShardConfig {
  shardId: number;
  tests: string[];
  estimatedTime: number;
  browser: string;
}

/**
 * Smart test distributor for optimal parallel execution
 */
export class BrowserStackTestDistributor {
  private readonly MAX_PARALLELS = 5;
  private readonly metricsFile = path.join(__dirname, '../../.browserstack-metrics.json');
  private metrics: Map<string, TestMetrics> = new Map();

  constructor() {
    this.loadMetrics();
  }

  /**
   * Load historical test metrics from file
   */
  private loadMetrics(): void {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
        this.metrics = new Map(Object.entries(data));
      }
<<<<<<< HEAD
    } catch {
=======
    } catch (error) {
>>>>>>> origin/master
      console.warn('Could not load test metrics, using defaults');
    }
  }

  /**
   * Save test metrics to file
   */
  public saveMetrics(): void {
    try {
      const data = Object.fromEntries(this.metrics);
      fs.writeFileSync(this.metricsFile, JSON.stringify(data, null, 2));
<<<<<<< HEAD
    } catch {
=======
    } catch (error) {
>>>>>>> origin/master
      console.warn('Could not save test metrics');
    }
  }

  /**
   * Update metrics after test run
   */
  public updateMetrics(testName: string, runTime: number, passed: boolean, browser: string): void {
    const existing = this.metrics.get(testName) || {
      name: testName,
      averageTime: runTime,
      failureRate: 0,
      browser,
    };

    // Update average time (weighted average)
    const weight = 0.7; // Give more weight to recent runs
    existing.averageTime = existing.averageTime * (1 - weight) + runTime * weight;
    existing.lastRunTime = runTime;
    
    // Update failure rate
    const failureWeight = 0.8;
    const currentFailure = passed ? 0 : 1;
    existing.failureRate = existing.failureRate * (1 - failureWeight) + currentFailure * failureWeight;
    
    existing.browser = browser;
    this.metrics.set(testName, existing);
  }

  /**
   * Distribute tests across parallel shards using bin packing algorithm
   */
  public distributeTests(
    testFiles: string[],
    browserConfigs: BrowserConfig[]
  ): ShardConfig[] {
    // Initialize shards
    const shards: ShardConfig[] = Array(Math.min(this.MAX_PARALLELS, browserConfigs.length))
      .fill(null)
      .map((_, index) => ({
        shardId: index + 1,
        tests: [],
        estimatedTime: 0,
        browser: browserConfigs[index % browserConfigs.length].name,
      }));

    // Sort tests by estimated time (longest first) for better distribution
    const sortedTests = testFiles.sort((a, b) => {
      const timeA = this.getEstimatedTime(a);
      const timeB = this.getEstimatedTime(b);
      return timeB - timeA;
    });

    // Distribute tests using bin packing algorithm
    sortedTests.forEach(test => {
      // Find the shard with minimum estimated time
      const targetShard = shards.reduce((min, current) =>
        current.estimatedTime < min.estimatedTime ? current : min
      );

      // Check for browser affinity
      const affinity = this.getBrowserAffinity(test);
      if (affinity) {
        const affinityShard = shards.find(s => s.browser === affinity);
        if (affinityShard && affinityShard.estimatedTime < targetShard.estimatedTime * 1.2) {
          // Use affinity shard if it's not too overloaded
          affinityShard.tests.push(test);
          affinityShard.estimatedTime += this.getEstimatedTime(test);
          return;
        }
      }

      targetShard.tests.push(test);
      targetShard.estimatedTime += this.getEstimatedTime(test);
    });

    return shards;
  }

  /**
   * Get estimated execution time for a test
   */
  private getEstimatedTime(testName: string): number {
    const metrics = this.metrics.get(testName);
    if (metrics) {
      // Add buffer for flaky tests
      const flakinessPenalty = metrics.failureRate * 30; // 30 seconds per expected retry
      return metrics.averageTime + flakinessPenalty;
    }
    // Default estimate based on test type
    if (testName.includes('smoke')) return 30;
    if (testName.includes('critical')) return 60;
    if (testName.includes('visual')) return 90;
    if (testName.includes('integration')) return 120;
    return 60; // Default 1 minute
  }

  /**
   * Get browser affinity for a test
   */
  private getBrowserAffinity(testName: string): string | undefined {
    // Mobile-specific tests
    if (testName.includes('mobile') || testName.includes('responsive')) {
      return 'iPhone-14-Pro';
    }
    // Safari-specific tests
    if (testName.includes('safari') || testName.includes('webkit')) {
      return 'Safari@latest-macOS';
    }
    // Windows-specific tests
    if (testName.includes('windows') || testName.includes('edge')) {
      return 'Edge@latest-Windows';
    }
    return undefined;
  }

  /**
   * Get optimal browser rotation based on time and usage
   */
  public getOptimalBrowserRotation(
    allBrowsers: BrowserConfig[],
    maxBrowsers: number = 5
  ): BrowserConfig[] {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // Business hours (9 AM - 5 PM): Focus on desktop browsers
    if (hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return allBrowsers
        .filter(b => !b.name.includes('iPhone') && !b.name.includes('Samsung'))
        .slice(0, maxBrowsers);
    }

    // Evening (5 PM - 11 PM): Focus on mobile browsers
    if (hour >= 17 && hour <= 23) {
      const mobileBrowsers = allBrowsers.filter(b => 
        b.name.includes('iPhone') || b.name.includes('Samsung') || b.name.includes('iPad')
      );
      const desktopBrowsers = allBrowsers.filter(b => 
        !b.name.includes('iPhone') && !b.name.includes('Samsung') && !b.name.includes('iPad')
      );
      return [...mobileBrowsers, ...desktopBrowsers].slice(0, maxBrowsers);
    }

    // Default: balanced mix
    return allBrowsers.slice(0, maxBrowsers);
  }

  /**
   * Generate test execution report
   */
  public generateReport(shards: ShardConfig[]): string {
    const totalTests = shards.reduce((sum, shard) => sum + shard.tests.length, 0);
    const maxTime = Math.max(...shards.map(s => s.estimatedTime));
    const avgTime = shards.reduce((sum, s) => sum + s.estimatedTime, 0) / shards.length;
    const efficiency = (avgTime / maxTime) * 100;

    return `
BrowserStack Test Distribution Report
=====================================
Total Tests: ${totalTests}
Parallel Shards: ${shards.length}
Estimated Runtime: ${Math.ceil(maxTime / 60)} minutes
Efficiency: ${efficiency.toFixed(1)}%

Shard Distribution:
${shards.map(shard => `
  Shard ${shard.shardId} (${shard.browser}):
    Tests: ${shard.tests.length}
    Estimated Time: ${Math.ceil(shard.estimatedTime / 60)} minutes
    Test Files: ${shard.tests.join(', ')}
`).join('')}

Optimization Tips:
${efficiency < 80 ? '- Consider rebalancing tests for better distribution' : ''}
${maxTime > 600 ? '- Consider splitting long-running tests' : ''}
${shards.some(s => s.tests.length === 0) ? '- Some shards are empty, reduce parallel count' : ''}
    `.trim();
  }
}

/**
 * Custom test fixture with BrowserStack metrics collection
 */
export const test = base.extend({
  // Auto-fixture that collects metrics
<<<<<<< HEAD
  collectMetrics: [async ({ page: _page }, use, testInfo) => {
=======
  collectMetrics: [async ({ page }, use, testInfo) => {
>>>>>>> origin/master
    const startTime = Date.now();
    const distributor = new BrowserStackTestDistributor();

    await use();

    const runTime = (Date.now() - startTime) / 1000; // Convert to seconds
    const browser = testInfo.project?.name || 'unknown';
    const passed = testInfo.status === 'passed';

    distributor.updateMetrics(
      testInfo.title,
      runTime,
      passed,
      browser
    );
    distributor.saveMetrics();
  }, { auto: true }],
<<<<<<< HEAD
} as any);
=======
});
>>>>>>> origin/master

/**
 * Intelligent retry strategy for flaky tests
 */
export class SmartRetryStrategy {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 5000;

  /**
   * Determine if a test should be retried based on failure type
   */
  public static shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.MAX_RETRIES) return false;

    // Network-related errors - always retry
    if (error.message.includes('net::') || 
        error.message.includes('TIMEOUT') ||
        error.message.includes('CONNECTION')) {
      return true;
    }

    // BrowserStack-specific errors - retry with delay
    if (error.message.includes('browserstack') ||
        error.message.includes('session') ||
        error.message.includes('WebSocket')) {
      // Wait before retry to let BrowserStack recover
      return new Promise(resolve => {
        setTimeout(() => resolve(true), this.RETRY_DELAY_MS);
      }) as unknown as boolean;
    }

    // Element not found - might be timing issue
    if (error.message.includes('element') && attempt < 2) {
      return true;
    }

    return false;
  }

  /**
   * Get retry delay based on error type and attempt
   */
  public static getRetryDelay(error: Error, attempt: number): number {
    // Exponential backoff for BrowserStack errors
    if (error.message.includes('browserstack')) {
      return Math.min(this.RETRY_DELAY_MS * Math.pow(2, attempt), 30000);
    }
    return this.RETRY_DELAY_MS;
  }
}

/**
 * Export utilities for use in tests
 */
export const browserStackUtils = {
  distributor: new BrowserStackTestDistributor(),
  retryStrategy: SmartRetryStrategy,
  test,
};