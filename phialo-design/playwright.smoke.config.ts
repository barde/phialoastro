import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Smoke test configuration for ultra-fast critical path validation
 * Target: <1 minute total execution time
 * Purpose: Verify core functionality is not broken
 */
export default defineConfig({
  ...baseConfig,
  
  // Ultra-short timeouts for smoke tests
  timeout: 20 * 1000, // 20 seconds per test
  
  // No retries for smoke tests - they should be stable
  retries: 0,
  
  // Maximum parallelization
  workers: process.env.CI ? 8 : 4,
  fullyParallel: true,
  
  // Minimal reporting
  reporter: process.env.CI ? [
    ['dot'],
    ['github']
  ] : 'dot',
  
  // Run only smoke tests
  grep: /@smoke/,
  
  use: {
    ...baseConfig.use,
    
    // No debugging for smoke tests
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    
    // Ultra-short timeouts
    actionTimeout: 5 * 1000, // 5 seconds
    navigationTimeout: 15 * 1000, // 15 seconds
    
    // Speed optimizations
    hasTouch: false,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    locale: 'en-US',
    timezoneId: 'UTC',
    
    // Block all non-essential resources
    serviceWorkers: 'block',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    
    // Standard viewport
    viewport: { width: 1280, height: 720 },
    
    // Reduce animations
    // reducedMotion: 'reduce', // Not supported in current Playwright types
    // forcedColors: 'none', // Not supported in current Playwright types
  },

  /* Minimal browser set - just Chrome for smoke tests */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
          ]
        }
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
        userAgent: devices['iPhone 12'].userAgent,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  /* Speed optimizations */
  expect: {
    // Very short timeout for assertions
    timeout: 5 * 1000,
    toHaveScreenshot: { 
      animations: 'disabled',
      caret: 'hide' 
    },
  },
  
  // No global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Output configuration
  outputDir: 'test-results-smoke',
  preserveOutput: 'never',
  quiet: true,
  
  // Never update snapshots in CI
  updateSnapshots: 'none',
  
  // Web server configuration
  webServer: baseConfig.webServer ? {
    ...baseConfig.webServer,
    timeout: 60 * 1000, // 1 minute
    reuseExistingServer: true, // Always reuse for speed
    // env: {  // env property not supported in current Playwright types
    //   ...baseConfig.webServer.env,
    //   NODE_ENV: 'test',
    //   ASTRO_TELEMETRY_DISABLED: '1',
    //   ASTRO_OPTIMIZE: '1',
    //   // Disable all non-essential features
    //   DISABLE_ANALYTICS: '1',
    //   DISABLE_TELEMETRY: '1',
    // },
  } : undefined,
});

/**
 * Smoke Test Guidelines:
 * 
 * 1. Tag smoke tests with @smoke:
 *    test('@smoke Homepage loads correctly', async ({ page }) => {
 *      await page.goto('/');
 *      await expect(page).toHaveTitle(/Phialo/);
 *    });
 * 
 * 2. Keep tests extremely simple:
 *    - Single assertion per test
 *    - No complex interactions
 *    - No waiting for animations
 *    - Direct navigation (no clicking through)
 * 
 * 3. Core smoke tests should verify:
 *    - Homepage loads
 *    - Language switching works
 *    - Mobile menu opens
 *    - Portfolio items display
 *    - Contact form renders
 * 
 * Usage:
 *   npm run test:smoke
 *   npx playwright test --config=playwright.smoke.config.ts
 */