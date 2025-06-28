import { test, expect } from '@playwright/test';

/**
 * BrowserStack-specific tests for real device testing
 * These tests are designed to validate behavior on actual devices
 */

test.describe('BrowserStack Real Device Tests', () => {
  test('@browserstack @critical Homepage renders correctly on real devices', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Verify core elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('@browserstack Mobile touch interactions work correctly', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }
    
    await page.goto('/portfolio');
    
    // Test touch scrolling
    const portfolioGrid = page.locator('[data-testid="portfolio-grid"]');
    await expect(portfolioGrid).toBeVisible();
    
    // Swipe gesture (BrowserStack supports native gestures)
    await portfolioGrid.scrollIntoViewIfNeeded();
    
    // Test tap on portfolio item
    const firstItem = page.locator('[data-testid="portfolio-item"]').first();
    await firstItem.tap();
    
    // Verify modal opens on mobile
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
  });

  test('@browserstack Cross-browser form submission', async ({ page, browserName }) => {
    await page.goto('/contact');
    
    // Fill form with test data
    await page.fill('input[name="name"]', `Test User ${browserName}`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Cross-browser test message');
    
    // Mock form submission
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message appears
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({
      timeout: 15000, // Longer timeout for real devices
    });
  });

  test('@browserstack Responsive images load correctly', async ({ page, viewport }) => {
    await page.goto('/portfolio');
    
    // Check that images load with appropriate sizes
    const images = page.locator('img[data-testid="portfolio-image"]');
    const imageCount = await images.count();
    
    expect(imageCount).toBeGreaterThan(0);
    
    // Verify images have loaded (not broken)
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
      
      // Check natural dimensions indicate image loaded
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
    
    // Take screenshot of portfolio grid
    await expect(page.locator('[data-testid="portfolio-grid"]')).toHaveScreenshot(
      `portfolio-grid-${viewport?.width}x${viewport?.height}.png`
    );
  });

  test('@browserstack Language persistence across navigation', async ({ page, context }) => {
    // Start in German (default)
    await page.goto('/');
    
    // Switch to English
    const langSelector = page.locator('[data-language-selector]');
    await langSelector.click();
    await page.getByRole('button', { name: /English|EN/i }).click();
    
    // Wait for navigation
    await page.waitForURL('**/en/**');
    
    // Navigate to different pages and verify language persists
    const pagesToTest = ['/portfolio', '/services', '/contact'];
    
    for (const pagePath of pagesToTest) {
      await page.goto(`/en${pagePath}`);
      
      // Verify we're still on English version
      expect(page.url()).toContain('/en/');
      
      // Verify English content is displayed
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('en');
    }
  });
});

test.describe('BrowserStack Performance Tests', () => {
  test('@browserstack Page load performance on real devices', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      };
    });
    
    // Performance assertions (adjust based on real device capabilities)
    expect(metrics.totalTime).toBeLessThan(5000); // 5 seconds max total load time
    expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds for DOM
    
    console.log('Performance metrics:', metrics);
  });
});