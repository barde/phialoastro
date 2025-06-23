import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * PR test configuration optimized for speed and critical coverage
 * Target: 5-10 minute total execution time
 * Focus: Critical user journeys and functionality
 */
export default defineConfig({
  ...baseConfig,
  
  // Optimize for speed with shorter timeouts
  timeout: 15 * 1000, // 15 seconds per test (half of base config)
  
  // Minimal retries to save time
  retries: process.env.CI ? 1 : 0,
  
  // Use 4 workers in CI for parallel execution
  workers: process.env.CI ? 4 : undefined,
  
  // Lightweight reporting for PR tests
  reporter: process.env.CI ? [
    ['list'],
    ['github'],
    ['html', { open: 'never', outputFolder: 'playwright-report-pr' }]
  ] : 'list',
  
  // Run only critical tests using grep pattern
  // Tests must have @critical tag to be included
  grep: /@critical/,
  
  // Alternatively, use testMatch for specific test files
  // testMatch: [
  //   '**/navigation.spec.ts',
  //   '**/contact-form.spec.ts',
  //   '**/landing-page.spec.ts',
  //   '**/portfolio-modal.spec.ts',
  //   '**/responsive.spec.ts'
  // ],
  
  use: {
    ...baseConfig.use,
    
    // Minimal debugging info to save time
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    
    // Shorter timeouts for faster feedback
    actionTimeout: 5 * 1000, // 5 seconds
    navigationTimeout: 15 * 1000, // 15 seconds
    
    // Skip animations to speed up tests
    hasTouch: false,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    locale: 'en-US',
    timezoneId: 'UTC',
    
    // Disable service workers for faster tests
    serviceWorkers: 'block',
    
    // Set viewport for consistency
    viewport: { width: 1280, height: 720 },
  },

  /* Minimal browser set for PR tests */
  projects: [
    // Desktop browsers (2 browsers)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Force fast mode
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Skip Firefox on Windows in CI to save time
        ...(process.env.CI && process.platform === 'win32' ? { skipBrowserInstall: true } : {})
      },
    },
    
    // Mobile browsers (2 devices)
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Reduce mobile viewport for faster rendering
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Reduce mobile viewport for faster rendering
        viewport: { width: 393, height: 727 }
      },
    },
  ],

  /* Speed optimizations for PR tests */
  expect: {
    // Shorter timeout for assertions
    timeout: 5 * 1000,
  },
  
  // Disable global setup/teardown if not needed
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Output folder for test results
  outputDir: 'test-results-pr',
  
  // Preserve test output for only failed tests
  preserveOutput: 'failures-only',
  
  // Quiet mode to reduce console output
  quiet: process.env.CI ? true : false,
  
  // Update snapshots only locally, never in CI
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  
  // Web server configuration optimized for speed
  webServer: {
    ...baseConfig.webServer,
    // Shorter timeout for server startup
    timeout: 60 * 1000, // 60 seconds
    // Kill any existing process on the port
    reuseExistingServer: true,
    // Add startup optimization flags
    command: process.env.CI 
      ? 'npm run build && npm run preview -- --port 4322'
      : 'npm run dev -- --port 4322',
    env: {
      NODE_ENV: 'test',
      // Disable telemetry and analytics in tests
      ASTRO_TELEMETRY_DISABLED: '1',
      // Use faster builds
      ASTRO_OPTIMIZE: '1',
    },
  },
});

/**
 * Usage:
 * 
 * To run PR tests locally:
 *   npx playwright test --config=playwright.pr.config.ts
 * 
 * To run specific test with @critical tag:
 *   npx playwright test --grep @critical
 * 
 * In GitHub Actions:
 *   - This config will automatically use 4 workers
 *   - Tests must be tagged with @critical to run
 *   - Total execution should be under 10 minutes
 * 
 * Tagging tests as critical:
 *   test('@critical Language switching works correctly', async ({ page }) => {
 *     // test implementation
 *   });
 */