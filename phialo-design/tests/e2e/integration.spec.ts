import { test, expect } from '@playwright/test';

test.describe('Integration Tests - All Fixes', () => {
  test('@critical Complete user journey in German', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    
    // Verify clean landing page (Issue #4)
    const floatingElements = await page.locator('.animate-float, .floating-logo').count();
    expect(floatingElements).toBe(0);
    
    // Toggle dark mode (Issue #12)
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    
    // Navigate to portfolio using logo (Issue #21)
    await page.goto('/portfolio');
    const logo = page.locator('header a:has-text("PHIALO")');
    await expect(logo).toHaveAttribute('href', '/');
    await logo.click();
    await expect(page).toHaveURL('/');
    
    // Go back to portfolio
    await page.locator('nav a[href="/portfolio"]').click();
    
    // Open portfolio modal (Issue #22)
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Check footer for phone number (Issue #7)
    const phoneLink = page.locator('footer a[href="tel:+4915785664700"]');
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toContainText('(+49) 1578 566 47 00');
    
    // Theme should still be dark
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
  });

  test('Complete user journey in English', async ({ page }) => {
    // Start at English homepage
    await page.goto('/en/');
    
    // Verify clean landing page
    const floatingElements = await page.locator('.animate-float, .floating-logo').count();
    expect(floatingElements).toBe(0);
    
    // Navigate to portfolio
    await page.locator('nav a[href="/en/portfolio"]').click();
    await expect(page).toHaveURL('/en/portfolio');
    
    // Test logo navigation from English page (Issue #21)
    const logo = page.locator('header a:has-text("PHIALO")');
    await expect(logo).toHaveAttribute('href', '/en/');
    await logo.click();
    await expect(page).toHaveURL('/en/');
    
    // Go to portfolio again
    await page.goto('/en/portfolio');
    
    // Open portfolio modal and verify English text (Issue #22)
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
    await expect(modal.locator('[data-modal-technique-label]')).toContainText('Technique');
    
    // Close modal
    await modal.locator('[data-modal-close]').click();
    
    // Check footer for phone number (Issue #7)
    const phoneLink = page.locator('footer a[href="tel:+4915785664700"]');
    await expect(phoneLink).toBeVisible();
  });

  test('Language switching preserves dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    
    // Switch to English
    const langSelector = page.locator('[data-language-selector]');
    await langSelector.click();
    await page.locator('a[href="/en/"]').click();
    
    // Dark mode should be preserved
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    
    // Navigate to portfolio
    await page.goto('/en/portfolio');
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    
    // Switch back to German
    await langSelector.click();
    await page.locator('a[href="/portfolio"]').click();
    
    // Dark mode should still be active
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
  });

  test('@critical Mobile responsiveness with all features', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Theme toggle should be accessible on mobile
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await expect(themeToggle).toBeVisible();
    
    // Language selector should be accessible
    const langSelector = page.locator('[data-language-selector]');
    await expect(langSelector).toBeVisible();
    
    // Navigate to portfolio (mobile menu if present)
    const mobileMenuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
    
    await page.locator('a[href="/portfolio"]').click();
    await expect(page).toHaveURL('/portfolio');
    
    // Portfolio items should be responsive
    const portfolioItems = page.locator('[data-portfolio-item]');
    const firstItem = portfolioItems.first();
    const itemWidth = await firstItem.evaluate(el => el.offsetWidth);
    expect(itemWidth).toBeLessThanOrEqual(375);
    
    // Footer should show phone number on mobile
    const phoneLink = page.locator('footer a[href="tel:+4915785664700"]');
    await expect(phoneLink).toBeVisible();
  });

  test('Performance and smooth transitions', async ({ page }) => {
    await page.goto('/');
    
    // Measure initial load performance
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
      };
    });
    
    // Page should load reasonably fast
    expect(performanceTiming.domContentLoaded).toBeLessThan(3000);
    
    // Test smooth theme transition
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.click();
    
    // Verify smooth transition is applied
    const body = page.locator('body');
    const transition = await body.evaluate(el => 
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain('background-color');
    
    // Navigate and ensure smooth page transitions
    await page.locator('nav a[href="/portfolio"]').click();
    await page.waitForLoadState('networkidle');
    
    // Portfolio page should load smoothly
    await expect(page.locator('[data-portfolio-item]').first()).toBeVisible();
  });
});