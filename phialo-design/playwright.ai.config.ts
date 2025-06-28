import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * AI-powered test configuration
 * Optimized for natural language testing and self-healing capabilities
 */
export default defineConfig({
  ...baseConfig,
  
  // Longer timeouts for AI operations
  timeout: 60 * 1000, // 60 seconds per test
  
  // More retries for self-healing
  retries: process.env.CI ? 3 : 2,
  
  // Fewer workers to manage AI API rate limits
  workers: process.env.CI ? 2 : 1,
  
  // Enhanced reporting for AI tests
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'ai-test-report' }],
    ['json', { outputFile: 'ai-test-results.json' }],
    // Custom reporter for AI insights
    ['./tests/e2e/reporters/ai-insights-reporter.ts'],
  ],
  
  use: {
    ...baseConfig.use,
    
    // Extended timeouts for AI operations
    actionTimeout: 30 * 1000,
    navigationTimeout: 45 * 1000,
    
    // Always capture evidence for AI analysis
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    
    // AI-specific context
    contextOptions: {
      // Inject AI helpers into every page
      recordVideo: {
        dir: 'ai-test-videos',
        size: { width: 1280, height: 720 },
      },
    },
  },

  // Run only AI tests
  grep: /@ai/,
  
  // Project configuration for AI testing
  projects: [
    {
      name: 'ai-chrome',
      use: {
        ...baseConfig.projects?.[0]?.use,
        // AI test context
        launchOptions: {
          slowMo: 100, // Slow down for AI to process
        },
      },
    },
    {
      name: 'ai-mobile',
      use: {
        ...baseConfig.projects?.find(p => p.name?.includes('Mobile'))?.use,
        // Mobile AI testing
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  // Global setup for AI tests
  globalSetup: './tests/e2e/setup/ai-setup.ts',
  
  // Environment variables for AI
});

/**
 * Environment Variables for AI Testing:
 * 
 * ZEROSTEP_API_TOKEN - API token for ZeroStep AI
 * AI_MODEL - AI model to use (default: gpt-4)
 * AI_MAX_RETRIES - Maximum retries for AI operations (default: 3)
 * AI_TIMEOUT - Timeout for AI operations in ms (default: 30000)
 * 
 * Usage:
 *   ZEROSTEP_API_TOKEN=your_token npx playwright test --config=playwright.ai.config.ts
 */