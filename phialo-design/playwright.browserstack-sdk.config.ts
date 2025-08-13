import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * BrowserStack SDK configuration for running tests on real devices
 * The SDK handles the connection to BrowserStack automatically
 */
export default defineConfig({
  ...baseConfig,
  
  // Longer timeouts for cloud execution
  timeout: 90 * 1000,
  
  // Retries for flakiness on real devices
  retries: process.env.CI ? 2 : 1,
  
  // Workers managed by BrowserStack SDK
  // IMPORTANT: Limited to 5 parallel sessions for Open Source plan
  workers: process.env.CI ? 5 : 1, // Max 5 for BrowserStack Open Source
  
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

  // Only run critical tests on BrowserStack by default
  grep: /@critical|@browserstack|@smoke/,
  
  // BrowserStack-specific settings
  expect: {
    timeout: 20 * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 100,
    },
  },
});