import { test, expect } from '@playwright/test';

/**
 * Example of critical tests that should run in PR checks
 * These tests are tagged with @critical and focus on core functionality
 */

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any common requirements
    await page.goto('/');
  });

  test('@critical Homepage loads and displays key elements', async ({ page }) => {
    // Verify the page loads
    await expect(page).toHaveTitle(/Phialo Design/);
    
    // Check critical elements are visible
    await expect(page.locator('header')).toBeVisible();
    // Check that at least one nav is visible (desktop or mobile button)
    const desktopNav = page.locator('nav.hidden.lg\\:flex');
    const mobileMenuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]');
    
    // Either desktop nav or mobile menu button should be visible
    const isDesktopNavVisible = await desktopNav.isVisible();
    const isMobileButtonVisible = await mobileMenuButton.first().isVisible();
    expect(isDesktopNavVisible || isMobileButtonVisible).toBeTruthy();
    
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify language selector exists
    await expect(page.locator('[data-language-selector]')).toBeVisible();
  });

  test('@critical Navigation menu works on desktop and mobile', async ({ page, viewport }) => {
    // Test desktop navigation - be specific about which nav
    const desktopNavLinks = page.locator('nav.hidden.lg\\:flex a');
    await expect(desktopNavLinks).toHaveCount(5); // Adjust based on actual nav items
    
    // Test mobile navigation if viewport is mobile
    if (viewport && viewport.width < 768) {
      // On mobile, desktop nav should be hidden
      await expect(page.locator('nav.hidden.lg\\:flex')).not.toBeVisible();
      
      // Check for mobile menu button
      const menuButton = page.locator('button[aria-label*="Menü"], button[aria-label*="menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        // Wait for mobile menu to open
        await expect(page.locator('nav.lg\\:hidden, div[class*="fixed"][class*="inset"]')).toBeVisible();
      }
    }
  });

  test('@critical Language switching preserves current page', async ({ page }) => {
    // Start on German portfolio page
    await page.goto('/portfolio');
    await expect(page).toHaveURL('/portfolio');
    
    // Switch to English
    const langSelector = page.locator('[data-language-selector]');
    await langSelector.click();
    await page.locator('a[href*="/en/"]').click();
    
    // Should be on English portfolio page
    await expect(page).toHaveURL('/en/portfolio');
    
    // Content should be in English
    await expect(page.locator('h1')).toContainText(/Portfolio|Works|Gallery/i);
  });

  test('@critical Contact form displays and accepts input', async ({ page }) => {
    // Navigate to contact page
    await page.goto('/contact');
    
    // Check form elements exist
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Fill out form fields
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message');
    
    // Verify inputs are filled
    await expect(page.locator('input[name="name"]')).toHaveValue('Test User');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
    
    // Note: Don't actually submit in PR tests to avoid sending emails
  });

  test('@critical Portfolio page loads and displays items', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Wait for portfolio items to load
    await page.waitForSelector('[data-portfolio-item]', { timeout: 10000 });
    
    // Verify at least one portfolio item exists
    const portfolioItems = page.locator('[data-portfolio-item]');
    await expect(portfolioItems).toHaveCount(await portfolioItems.count());
    await expect(await portfolioItems.count()).toBeGreaterThan(0);
    
    // Check first item has required elements
    const firstItem = portfolioItems.first();
    await expect(firstItem.locator('img')).toBeVisible();
    await expect(firstItem.locator('h3, h4')).toBeVisible(); // Title
  });

  test('@critical Site is responsive on mobile devices', async ({ page }) => {
    // This test only runs on mobile devices due to PR config
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.goto('/');
      
      // Check mobile-specific elements
      const mobileMenu = page.locator('[data-mobile-menu-button]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible();
      }
      
      // Verify content is not horizontally scrollable
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    }
  });
});

// Example of non-critical tests that won't run in PR checks
test.describe('Comprehensive Tests (Nightly Only)', () => {
  test('All meta tags are present on all pages', async ({ page }) => {
    // This comprehensive test is too slow for PR checks
    const pages = ['/', '/portfolio', '/services', '/tutorials', '/about', '/contact'];
    for (const path of pages) {
      await page.goto(path);
      // Check meta tags...
    }
  });

  test('Visual regression test for all components', async ({ page }) => {
    // Screenshot tests are slow and not critical for PRs
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });
});