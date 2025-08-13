import { defineConfig } from '@playwright/test';

/**
 * BrowserStack SDK configuration for running tests on real devices
 * The SDK handles the connection to BrowserStack automatically
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // No parallel execution to stay within limits
  fullyParallel: false,
  
  // Disable local workers as BrowserStack SDK manages them
  workers: 1,
  
  // Longer timeouts for cloud execution
  timeout: 90 * 1000,
  
  // Disable retries to reduce session usage
  retries: 0,
  
  // Enhanced reporting for cloud tests
  reporter: process.env.CI ? [
    ['list'],
    ['html', { open: 'never', outputFolder: 'browserstack-report' }],
    ['json', { outputFile: 'browserstack-results.json' }]
  ] : 'list',
  
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'https://phialo-pr-346.meise.workers.dev',
    
    // Extended timeouts for cloud
    actionTimeout: 20 * 1000,
    navigationTimeout: 45 * 1000,
    
    // Always capture traces on BrowserStack
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },

  // Only run smoke tests to reduce test count and session usage
  grep: /@smoke/,
  
  // BrowserStack-specific settings
  expect: {
    timeout: 20 * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 100,
    },
  },
});