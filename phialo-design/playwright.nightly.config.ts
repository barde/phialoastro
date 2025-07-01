import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Nightly test configuration with full browser matrix and all test scenarios
 * This configuration is optimized for comprehensive testing, not speed
 */
export default defineConfig({
  ...baseConfig,
  
  // Extend timeout for nightly tests
  timeout: 60 * 1000, // 60 seconds per test
  
  // More retries for nightly runs
  retries: 3,
  
  // Use more workers for nightly runs (not limited by CI constraints)
  workers: process.env.CI ? 4 : undefined,
  
  // Enhanced reporting for nightly runs
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    ...baseConfig.use,
    
    // Capture more debugging info in nightly runs
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    
    // Extended timeouts for nightly runs
    actionTimeout: 20 * 1000,
    navigationTimeout: 60 * 1000,
  },

  /* Full browser matrix for nightly tests */
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Desktop browsers with specific viewports
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Mobile Chrome Landscape',
      use: { 
        ...devices['Pixel 5 landscape']
      },
    },
    {
      name: 'Mobile Safari Landscape',
      use: { 
        ...devices['iPhone 12 landscape']
      },
    },
    
    // Tablet devices
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'iPad Landscape',
      use: { ...devices['iPad Pro landscape'] },
    },
    
    // High DPI screens
    {
      name: 'Chrome HiDPI',
      use: {
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 2560, height: 1440 }
      },
    },
    
    // Accessibility testing with reduced motion
    {
      name: 'Chrome Reduced Motion',
      use: {
        ...devices['Desktop Chrome'],
        // reducedMotion: 'reduce', // Not supported in current Playwright types
      },
    },
    
    // Dark mode testing
    {
      name: 'Chrome Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
  ],

  /* Shard configuration for parallel execution across multiple machines */
  shard: process.env.SHARD ? {
    total: parseInt(process.env.TOTAL_SHARDS || '1'),
    current: parseInt(process.env.SHARD || '1')
  } : undefined,
});