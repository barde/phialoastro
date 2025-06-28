import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Ultra-fast validation of core functionality
 * Target execution time: <1 minute total
 * These tests should NEVER fail in a working system
 */

test.describe('Smoke Tests', () => {
  test('@smoke Homepage loads and displays content', async ({ page }) => {
    await page.goto('/');
    
    // Page loads successfully
    await expect(page).toHaveTitle(/Phialo/);
    
    // Main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigation is present
    await expect(page.locator('header')).toBeVisible();
  });

  test('@smoke Language switching works', async ({ page }) => {
    await page.goto('/');
    
    // Language selector is visible
    const langSelector = page.locator('[data-language-selector]');
    await expect(langSelector).toBeVisible();
    
    // Click to switch to English
    await langSelector.click();
    await page.getByRole('button', { name: /English|EN/i }).click();
    
    // Verify URL changed to English
    await page.waitForURL('**/en/**');
    expect(page.url()).toContain('/en/');
  });

  test('@smoke Portfolio page loads with items', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Portfolio items are visible
    const portfolioItems = page.locator('[data-testid="portfolio-item"]');
    await expect(portfolioItems.first()).toBeVisible();
    
    // At least one item exists
    const itemCount = await portfolioItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('@smoke Contact form is accessible', async ({ page }) => {
    await page.goto('/contact');
    
    // Form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('@smoke Mobile menu works', async ({ page, isMobile }) => {
    // Only run on mobile viewports
    if (!isMobile) {
      test.skip();
    }
    
    await page.goto('/');
    
    // Mobile menu button is visible
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Click opens menu
    await menuButton.click();
    
    // Menu panel appears
    const menuPanel = page.locator('[data-testid="mobile-menu-panel"]');
    await expect(menuPanel).toBeVisible();
  });
});

/**
 * Critical path smoke test - Single test that validates the entire user journey
 */
test('@smoke Critical user journey', async ({ page }) => {
  // 1. Homepage loads
  await page.goto('/');
  await expect(page).toHaveTitle(/Phialo/);
  
  // 2. Navigate to portfolio
  await page.getByRole('link', { name: /Portfolio/i }).first().click();
  await page.waitForURL('**/portfolio');
  
  // 3. Portfolio items load
  const portfolioItems = page.locator('[data-testid="portfolio-item"]');
  await expect(portfolioItems.first()).toBeVisible();
  
  // 4. Navigate to contact
  await page.getByRole('link', { name: /Kontakt|Contact/i }).first().click();
  await page.waitForURL('**/contact');
  
  // 5. Contact form is ready
  await expect(page.locator('form')).toBeVisible();
});