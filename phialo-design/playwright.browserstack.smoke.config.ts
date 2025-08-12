import { defineConfig } from '@playwright/test';
import bsConfig from './playwright.browserstack.config';

/**
 * BrowserStack configuration for production smoke tests
 * Runs a minimal set of critical tests on production after deployment
 */

const BS_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BS_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

// Validate that required environment variables are set
if (!BS_USERNAME || !BS_ACCESS_KEY) {
  throw new Error(
    'BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set as environment variables.\n' +
    'Please set these variables before running BrowserStack tests.'
  );
}

// Enhanced BrowserStack capabilities for smoke tests
const bsSmokeCapabilities = {
  'browserstack.username': BS_USERNAME,
  'browserstack.accessKey': BS_ACCESS_KEY,
  'browserstack.projectName': 'Phialo Design - Production Smoke Tests',
  'browserstack.buildName': `Smoke Test #${process.env.GITHUB_RUN_NUMBER || 'local'} - ${process.env.GITHUB_REF_NAME || 'production'}`,
  'browserstack.buildTag': 'production-smoke',
  'browserstack.sessionName': process.env.TEST_SESSION_NAME || 'Production Smoke Tests',
  'browserstack.debug': true,
  'browserstack.console': 'errors',
  'browserstack.networkLogs': false, // Disable for faster smoke tests
  'browserstack.maskCommands': true,
};

// Get the base projects from the main BrowserStack config
const baseProjects = bsConfig.projects || [];

export default defineConfig({
  ...bsConfig,
  
  // Smoke test specific settings
  testDir: './tests/e2e',
  
  // Faster timeouts for smoke tests
  timeout: 30 * 1000, // 30 seconds
  
  // Minimal retries for smoke tests
  retries: 1,
  
  // Limit workers for smoke tests (only 2 browsers)
  workers: 2,
  
  // Lightweight reporting for smoke tests
  reporter: process.env.CI ? [
    ['list'],
    ['github'],
    ['json', { outputFile: 'smoke-test-results.json' }]
  ] : 'list',
  
  use: {
    ...bsConfig.use,
    
    // Use production URL or deployment URL
    baseURL: process.env.BASE_URL || process.env.DEPLOYMENT_URL || 'https://phialo.de',
    
    // Connect to BrowserStack with smoke test capabilities
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(bsSmokeCapabilities))}`,
    },
    
    // Faster timeouts for smoke tests
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    
    // Minimal debugging for smoke tests (faster execution)
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  /* Minimal browser matrix for smoke tests */
  projects: [
    // Desktop - Most common browser
    {
      name: 'Chrome@latest-Windows',
      use: {
        ...baseProjects.find(p => p.name === 'Chrome@latest-Windows')?.use,
        ...({ 'browserstack:options': {
          ...bsSmokeCapabilities,
          os: 'Windows',
          osVersion: '11',
          browserName: 'Chrome',
          browserVersion: 'latest',
        }} as any),
      },
    },
    // Mobile - Most critical mobile device
    {
      name: 'iPhone-14-Pro',
      use: {
        ...baseProjects.find(p => p.name === 'iPhone-14-Pro')?.use,
        ...({ 'browserstack:options': {
          ...bsSmokeCapabilities,
          deviceName: 'iPhone 14 Pro',
          osVersion: '16',
          realMobile: 'true',
        }} as any),
      },
    },
  ],

  // Only run smoke tests
  grep: /@smoke/,
  
  // Smoke test specific expectations
  expect: {
    timeout: 10 * 1000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixels: 200, // More lenient for production variations
    },
  },
});

/**
 * Usage:
 * 
 * Set environment variables:
 *   export BROWSERSTACK_USERNAME=your_username
 *   export BROWSERSTACK_ACCESS_KEY=your_access_key
 *   export BASE_URL=https://phialo.de  # Or your deployment URL
 * 
 * Run smoke tests:
 *   npx playwright test --config=playwright.browserstack.smoke.config.ts
 * 
 * This configuration is optimized for:
 * - Fast execution (< 5 minutes)
 * - Critical path validation
 * - Production monitoring
 * - Deployment verification
 */