import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * BrowserStack configuration for running tests on real devices
 * Requires BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables
 */

const BS_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BS_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

// Validate that required environment variables are set
if (!BS_USERNAME || !BS_ACCESS_KEY) {
  throw new Error(
    'BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set as environment variables.\n' +
    'Please set these variables before running BrowserStack tests.\n' +
    'Example: export BROWSERSTACK_USERNAME=your_username && export BROWSERSTACK_ACCESS_KEY=your_access_key'
  );
}

// BrowserStack capabilities
const bsCapabilities = {
  'browserstack.username': BS_USERNAME,
  'browserstack.accessKey': BS_ACCESS_KEY,
  'browserstack.projectName': 'Phialo Design E2E Tests',
  'browserstack.buildName': `Build ${process.env.GITHUB_RUN_NUMBER || 'local'} - ${new Date().toISOString()}`,
  'browserstack.local': process.env.BS_LOCAL === 'true',
  'browserstack.localIdentifier': process.env.BS_LOCAL_IDENTIFIER,
  'browserstack.debug': true,
  'browserstack.console': 'errors',
  'browserstack.networkLogs': true,
};

export default defineConfig({
  ...baseConfig,
  
  // Longer timeouts for cloud execution
  timeout: 90 * 1000, // 90 seconds
  
  // Retries for flakiness on real devices
  retries: process.env.CI ? 2 : 1,
  
  // Limit workers for BrowserStack plan limits
  workers: 5, // BrowserStack Open Source allows 5 parallel tests
  
  // Enhanced reporting for cloud tests
  reporter: process.env.CI ? [
    ['list'],
    ['html', { open: 'never', outputFolder: 'browserstack-report' }],
    ['json', { outputFile: 'browserstack-results.json' }]
  ] : 'list',
  
  use: {
    ...baseConfig.use,
    
    // Connect to BrowserStack
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(bsCapabilities))}`,
    },
    
    // Extended timeouts for cloud
    actionTimeout: 20 * 1000,
    navigationTimeout: 45 * 1000,
    
    // Always capture traces on BrowserStack
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },

  /* BrowserStack Device & Browser Matrix */
  projects: [
    // Desktop Browsers - Latest versions
    {
      name: 'Chrome@latest-Windows',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        browserName: 'chromium',
        'browserstack:options': {
          ...bsCapabilities,
          os: 'Windows',
          osVersion: '11',
          browserName: 'Chrome',
          browserVersion: 'latest',
        },
      },
    },
    {
      name: 'Safari@latest-macOS',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
        'browserstack:options': {
          ...bsCapabilities,
          os: 'OS X',
          osVersion: 'Sonoma',
          browserName: 'Safari',
          browserVersion: '17.0',
        },
      },
    },
    {
      name: 'Edge@latest-Windows',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        browserName: 'chromium',
        'browserstack:options': {
          ...bsCapabilities,
          os: 'Windows',
          osVersion: '11',
          browserName: 'Edge',
          browserVersion: 'latest',
        },
      },
    },

    // Real Mobile Devices
    {
      name: 'iPhone-14-Pro',
      use: {
        ...devices['iPhone 14 Pro'],
        'browserstack:options': {
          ...bsCapabilities,
          deviceName: 'iPhone 14 Pro',
          osVersion: '16',
          realMobile: 'true',
        },
      },
    },
    {
      name: 'Samsung-S23',
      use: {
        ...devices['Galaxy S23'],
        'browserstack:options': {
          ...bsCapabilities,
          deviceName: 'Samsung Galaxy S23',
          osVersion: '13.0',
          realMobile: 'true',
        },
      },
    },
    {
      name: 'iPad-Pro-12.9',
      use: {
        ...devices['iPad Pro 11'],
        'browserstack:options': {
          ...bsCapabilities,
          deviceName: 'iPad Pro 12.9 2022',
          osVersion: '16',
          realMobile: 'true',
        },
      },
    },
  ],

  // Only run critical tests on BrowserStack
  grep: /@critical|@browserstack/,
  
  // BrowserStack-specific settings
  expect: {
    timeout: 20 * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 100, // Allow small differences on real devices
    },
  },
});

/**
 * Usage:
 * 
 * Set environment variables:
 *   export BROWSERSTACK_USERNAME=your_username
 *   export BROWSERSTACK_ACCESS_KEY=your_access_key
 * 
 * Run tests:
 *   npx playwright test --config=playwright.browserstack.config.ts
 * 
 * Run specific browser:
 *   npx playwright test --config=playwright.browserstack.config.ts --project="iPhone-14-Pro"
 * 
 * For local testing with BrowserStack:
 *   1. Install BrowserStack Local: npm install -g browserstack-local
 *   2. Start tunnel: BrowserStackLocal --key YOUR_ACCESS_KEY
 *   3. Set BS_LOCAL=true when running tests
 * 
 * Tag tests for BrowserStack:
 *   test('@browserstack Visual regression on real devices', async ({ page }) => {
 *     // test implementation
 *   });
 */