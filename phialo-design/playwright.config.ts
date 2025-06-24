import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * Playwright Configuration for Phialo Design E2E Tests
 * 
 * This configuration supports both PR (filtered) and nightly (full) test runs:
 * 
 * PR Tests (fast, critical tests only):
 *   TEST_TAG=@critical npm run test:e2e
 * 
 * Nightly Tests (full suite, all browsers):
 *   npm run test:e2e
 * 
 * Test Annotations:
 *   - @critical: Must-pass tests for PR checks
 *   - @smoke: Basic functionality tests
 *   - @visual: Visual regression tests
 *   - @slow: Long-running tests (excluded from PR runs)
 * 
 * Example test with annotation:
 *   test('@critical homepage loads', async ({ page }) => {
 *     // test code
 *   });
 * 
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Enable parallel execution with 4 workers in CI */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI 
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results.json' }],
        ['junit', { outputFile: 'test-results.xml' }]
      ]
    : 'html',
  /* Timeout for each test */
  timeout: 60 * 1000,
  /* Timeout for each assertion */
  expect: {
    timeout: 10 * 1000,
  },
  /* Test annotations support for filtering */
  grep: process.env.TEST_TAG ? new RegExp(process.env.TEST_TAG) : undefined,
  grepInvert: process.env.TEST_TAG_EXCLUDE ? new RegExp(process.env.TEST_TAG_EXCLUDE) : undefined,
  /* Global test settings */
  globalSetup: undefined, // Can be added for database setup, auth, etc.
  globalTeardown: undefined, // Can be added for cleanup
  /* Output folder for test artifacts */
  outputDir: 'test-results',
  /* Maximum number of test failures for the whole test suite run */
  maxFailures: process.env.CI ? 10 : undefined,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:4322',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure in CI */
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    /* Action timeout */
    actionTimeout: 15 * 1000,
    
    /* Navigation timeout */
    navigationTimeout: 45 * 1000,
    
    /* Test id attribute */
    testIdAttribute: 'data-testid',
    
    /* Bypass CSP for faster execution */
    bypassCSP: true,
    
    /* Locale and timezone for consistency */
    locale: 'en-US',
    timezoneId: 'UTC',
  },

  /* Configure projects for major browsers */
  projects: [
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

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});