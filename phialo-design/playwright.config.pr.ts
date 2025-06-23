import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Playwright configuration for PR tests
 * This configuration runs only core E2E scenarios with a reduced browser matrix
 * to optimize CI performance while maintaining good test coverage.
 */
export default defineConfig({
  ...baseConfig,
  
  /* Use 4 workers for better performance */
  workers: 4,
  
  /* Configure projects for critical browsers only */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    /* Mobile viewports for responsive testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  /* Core test files for PR runs */
  testMatch: [
    'navigation.spec.ts',
    'landing-page.spec.ts',
    'portfolio-filtering.spec.ts',
    'contact-form.spec.ts',
    'responsive.spec.ts',
  ],
});