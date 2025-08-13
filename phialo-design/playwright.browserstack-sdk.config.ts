import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * BrowserStack SDK configuration for running tests on real devices
 * The SDK handles the connection to BrowserStack automatically
 */
export default defineConfig({
  ...baseConfig,
  
  // No parallel execution to stay within limits
  fullyParallel: false,
  
  // Longer timeouts for cloud execution
  timeout: 90 * 1000,
  
  // Disable retries to reduce session usage
  retries: 0, // No retries to conserve BrowserStack sessions
  
  // Workers managed by BrowserStack SDK
  // CRITICAL: Must stay within BrowserStack Open Source limit
  // With 3 platforms, use 1 worker per platform to avoid exceeding 5 sessions
  workers: 1, // Single worker to prevent session conflicts
  
  // Enhanced reporting for cloud tests
  reporter: process.env.CI ? [
    ['list'],
    ['html', { open: 'never', outputFolder: 'browserstack-report' }],
    ['json', { outputFile: 'browserstack-results.json' }]
  ] : 'list',
  
  use: {
    ...baseConfig.use,
    
    // Extended timeouts for cloud
    actionTimeout: 20 * 1000,
    navigationTimeout: 45 * 1000,
    
    // Always capture traces on BrowserStack
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },

  // Define projects with browserName for BrowserStack SDK
  // The SDK will map these to the platforms defined in browserstack.yml
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // BrowserStack SDK expects browserName
        browserName: 'chromium',
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        browserName: 'webkit',
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14 Pro'],
        browserName: 'webkit',
      },
    },
  ],

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