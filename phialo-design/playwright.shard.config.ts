import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.pr.config';

/**
 * Sharded test configuration for maximum parallelization
 * Used in CI to split tests across multiple machines/jobs
 */
export default defineConfig({
  ...baseConfig,
  
  // Enable sharding for distributed execution
  // This will be controlled by CI environment variables
  shard: process.env.CI ? {
    current: parseInt(process.env.SHARD_INDEX || '1'),
    total: parseInt(process.env.TOTAL_SHARDS || '4')
  } : undefined,
  
  // Maximum workers per shard
  workers: process.env.CI ? 2 : 4,
  
  // More aggressive parallelization
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  
  // Reporting optimized for sharding
  reporter: process.env.CI ? [
    ['list'],
    ['json', { outputFile: `test-results-shard-${process.env.SHARD_INDEX || '1'}.json` }],
    ['blob', { outputDir: `blob-report-${process.env.SHARD_INDEX || '1'}` }]
  ] : 'list',
  
  // Use blob reporter for merging results later
  use: {
    ...baseConfig.use,
    // Add shard info to screenshots/videos
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
      // Include shard number in filename
      nameTemplate: '{testName}-{projectName}-shard{shardIndex}-{arg}{ext}'
    },
  },
});

/**
 * Sharding Strategy:
 * 
 * 1. Split tests into 4 shards by default
 * 2. Each shard runs 2 workers (8 total parallel executions)
 * 3. Tests are automatically distributed by Playwright
 * 
 * GitHub Actions Usage:
 * ```yaml
 * strategy:
 *   matrix:
 *     shard: [1, 2, 3, 4]
 * env:
 *   SHARD_INDEX: ${{ matrix.shard }}
 *   TOTAL_SHARDS: 4
 * ```
 * 
 * Merge reports after all shards complete:
 * ```bash
 * npx playwright merge-reports --reporter html ./blob-report-*
 * ```
 */