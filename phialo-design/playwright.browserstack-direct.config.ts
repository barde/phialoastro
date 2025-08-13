import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

const BS_USER = process.env.BROWSERSTACK_USERNAME;
const BS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;
const BUILD_NAME = process.env.BROWSERSTACK_BUILD_NAME || `Build ${Date.now()}`;

/**
 * Direct BrowserStack configuration without SDK
 * Uses Playwright's native WebSocket connection to BrowserStack
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Timeout configuration
  timeout: 90 * 1000,
  globalTimeout: 60 * 60 * 1000, // 1 hour for all tests
  
  // No retries to conserve sessions
  retries: 0,
  
  // Single worker to stay within limits
  workers: 1,
  fullyParallel: false,
  
  // Reporting
  reporter: process.env.CI ? [
    ['list'],
    ['html', { open: 'never', outputFolder: 'browserstack-report' }],
    ['json', { outputFile: 'browserstack-results.json' }]
  ] : 'list',
  
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'https://phialo-pr-346.meise.workers.dev',
    
    // Extended timeouts for cloud
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
    
    // Capture evidence
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Define projects for BrowserStack browsers
  projects: [
    {
      name: 'Chrome@Windows',
      use: {
        ...devices['Desktop Chrome'],
        // Use CDP endpoint with authentication in URL
        connectOptions: {
          wsEndpoint: `wss://${BS_USER}:${BS_KEY}@cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
            'browserName': 'chrome',
            'browserVersion': 'latest',
            'bstack:options': {
              'os': 'Windows',
              'osVersion': '11',
              'projectName': 'Phialo Design',
              'buildName': BUILD_NAME,
              'sessionName': 'Chrome Windows Test',
              'debug': 'true',
              'consoleLogs': 'errors',
              'networkLogs': 'true'
            }
          }))}`,
        },
      },
    },
    {
      name: 'Safari@macOS',
      use: {
        ...devices['Desktop Safari'],
        connectOptions: {
          wsEndpoint: `wss://${BS_USER}:${BS_KEY}@cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
            'browserName': 'safari',
            'browserVersion': 'latest',
            'bstack:options': {
              'os': 'OS X',
              'osVersion': 'Sonoma',
              'projectName': 'Phialo Design',
              'buildName': BUILD_NAME,
              'sessionName': 'Safari macOS Test',
              'debug': 'true',
              'consoleLogs': 'errors',
              'networkLogs': 'true'
            }
          }))}`,
        },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14 Pro'],
        connectOptions: {
          wsEndpoint: `wss://${BS_USER}:${BS_KEY}@cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
            'browserName': 'safari',
            'bstack:options': {
              'deviceName': 'iPhone 14 Pro',
              'osVersion': '16',
              'realMobile': 'true',
              'projectName': 'Phialo Design',
              'buildName': BUILD_NAME,
              'sessionName': 'iPhone 14 Pro Test',
              'debug': 'true',
              'consoleLogs': 'errors',
              'networkLogs': 'true'
            }
          }))}`,
        },
      },
    },
  ],

  // Only run smoke tests
  grep: /@smoke/,
  
  // Screenshot comparison settings
  expect: {
    timeout: 30 * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 100,
    },
  },
});