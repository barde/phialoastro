import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Simple smoke test configuration that runs locally
 * without BrowserStack dependency
 */
export default defineConfig({
  ...baseConfig,
  
  // Smoke test specific settings
  testDir: './tests/e2e',
  
  // Faster timeouts for smoke tests
  timeout: 30 * 1000,
  
  // Minimal retries
  retries: 1,
  
  // Use 2 workers
  workers: 2,
  
  // Lightweight reporting
  reporter: process.env.CI ? [
    ['list'],
    ['github'],
    ['json', { outputFile: 'smoke-test-results.json' }]
  ] : 'list',
  
  use: {
    ...baseConfig.use,
    
    // Use deployment URL if provided
    baseURL: process.env.BASE_URL || process.env.DEPLOYMENT_URL || 'https://phialo.de',
    
    // Faster timeouts
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    
    // Minimal debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  /* Simple browser matrix for smoke tests */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Only run smoke tests
  grep: /@smoke/,
});