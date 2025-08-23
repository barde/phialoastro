import { test, expect } from '@playwright/test';

test.describe('Mobile Hamburger Menu Fix - Issue #402', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('hamburger menu should work after multiple clicks without page reload', async ({ page }) => {
    await page.goto('/');
    
    // First click - open menu
    const hamburgerButton = page.locator('#mobile-menu-btn');
    const mobileMenu = page.locator('#mobile-menu');
    
    await expect(hamburgerButton).toBeVisible();
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Close menu by clicking close button
    const closeButton = page.locator('#mobile-menu-close');
    await closeButton.click();
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    // Second click - should still work
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Close again
    await closeButton.click();
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    // Third click - should still work without reload
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
  });

  test('hamburger menu should work after client-side navigation', async ({ page }) => {
    await page.goto('/');
    
    const hamburgerButton = page.locator('#mobile-menu-btn');
    const mobileMenu = page.locator('#mobile-menu');
    
    // Open menu and navigate to another page
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Click a navigation link (triggers client-side navigation)
    await page.locator('#mobile-menu a[href="/portfolio"]').click();
    await page.waitForURL('**/portfolio');
    
    // Menu should be closed after navigation
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    // Hamburger button should still work on new page
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Close and open again
    const closeButton = page.locator('#mobile-menu-close');
    await closeButton.click();
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
  });

  test('escape key should close menu across page navigations', async ({ page }) => {
    await page.goto('/');
    
    const hamburgerButton = page.locator('#mobile-menu-btn');
    const mobileMenu = page.locator('#mobile-menu');
    
    // Open menu
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
    
    // Navigate to another page
    await page.goto('/services');
    
    // Open menu on new page
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Escape should still work
    await page.keyboard.press('Escape');
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
  });

  test('body overflow should be properly managed', async ({ page }) => {
    await page.goto('/');
    
    const hamburgerButton = page.locator('#mobile-menu-btn');
    
    // Check initial body overflow
    let bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
    
    // Open menu - body overflow should be hidden
    await hamburgerButton.click();
    bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');
    
    // Close menu - body overflow should be restored
    const closeButton = page.locator('#mobile-menu-close');
    await closeButton.click();
    bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });

  test('menu should remain functional after rapid open/close cycles', async ({ page }) => {
    await page.goto('/');
    
    const hamburgerButton = page.locator('#mobile-menu-btn');
    const closeButton = page.locator('#mobile-menu-close');
    const mobileMenu = page.locator('#mobile-menu');
    
    // Perform rapid open/close cycles
    for (let i = 0; i < 5; i++) {
      await hamburgerButton.click();
      await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
      
      await closeButton.click();
      await expect(mobileMenu).toHaveClass(/translate-x-full/);
    }
    
    // Menu should still be functional after rapid cycling
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
  });

  test('menu should work correctly with German and English pages', async ({ page }) => {
    // Test German page
    await page.goto('/');
    
    const hamburgerButton = page.locator('#mobile-menu-btn');
    const mobileMenu = page.locator('#mobile-menu');
    
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    // Navigate to English version
    await page.goto('/en/');
    
    // Menu should still work
    await hamburgerButton.click();
    await expect(mobileMenu).not.toHaveClass(/translate-x-full/);
    
    const closeButton = page.locator('#mobile-menu-close');
    await closeButton.click();
    await expect(mobileMenu).toHaveClass(/translate-x-full/);
  });
});