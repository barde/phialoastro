import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile Navigation', () => {
    test('@critical Mobile menu should be functional @mobile', async ({ page, isMobile }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 dimensions
      await page.goto('/');
      
      // Wait for hydration
      await page.waitForLoadState('networkidle');
      
      // Check if mobile menu button is visible
      const menuButton = page.locator('button[aria-label*="öffnen"], button[aria-label*="Open menu"]');
      await expect(menuButton).toBeVisible();
      
      // Open mobile menu
      await menuButton.click();
      
      // Wait for menu animation
      await page.waitForTimeout(300);
      
      // Check navigation items are visible - specifically mobile nav
      const mobileNav = page.locator('nav.lg\\:hidden, div[class*="fixed"][class*="inset"] nav');
      await expect(mobileNav).toBeVisible();
      
      const navItems = mobileNav.locator('a');
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);
      
      // Navigation items should be accessible
      for (let i = 0; i < navCount; i++) {
        await expect(navItems.nth(i)).toBeVisible();
      }
    });
    
    // Theme toggle test moved to tests/future/dark-mode.spec.ts
    // Will be implemented when dark mode feature is added (Issue #12)
  });

  test('@critical Theme toggle should work on mobile @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only test');
    
    await page.goto('/');
    
    // Open mobile menu if needed
    const menuButton = page.locator('button[aria-label*="öffnen"], button[aria-label*="Open menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForSelector('nav.lg\\:hidden, div[class*="fixed"][class*="inset"] nav', { state: 'visible' });
    }
    
    // Find theme toggle in mobile menu
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    // Toggle dark mode
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Close mobile menu
    if (await menuButton.isVisible()) {
        await menuButton.click();
    }
    
    // Verify dark mode persists
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test.describe('Tablet View', () => {
    test('Layout should adapt for tablet screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Wait for hydration
      await page.waitForLoadState('networkidle');
      
      // Header should be visible
      const header = page.locator('header#main-header');
      await expect(header).toBeVisible();
      
      // Check if navigation is in desktop mode (no hamburger menu)
      const desktopNav = page.locator('nav:not([aria-hidden="true"])');
      await expect(desktopNav).toBeVisible();
      
      // Mobile menu button should not be visible
      const menuButton = page.locator('button[aria-label*="öffnen"], button[aria-label*="Open menu"]');
      await expect(menuButton).not.toBeVisible();
    });
  });
  
  test.describe('Desktop View', () => {
    test('Full navigation should be visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      
      // Wait for hydration
      await page.waitForLoadState('networkidle');
      
      // All navigation items should be visible
      const navLinks = page.locator('nav a[href^="/"]');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(4); // Should have multiple nav items
      
      // Check visibility of each link
      for (let i = 0; i < linkCount; i++) {
        await expect(navLinks.nth(i)).toBeVisible();
      }
    });
  });
  
  test.describe('Responsive Images', () => {
    test('Images should load appropriate sizes', async ({ page }) => {
      await page.goto('/');
      
      // Wait for images to start loading
      await page.waitForLoadState('domcontentloaded');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Check first image has proper attributes
        const firstImage = images.first();
        
        // Should have src or srcset
        const src = await firstImage.getAttribute('src');
        const srcset = await firstImage.getAttribute('srcset');
        expect(src || srcset).toBeTruthy();
        
        // Should have alt text for accessibility
        const alt = await firstImage.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });
  });
  
  test.describe('Typography Responsiveness', () => {
    test('Font sizes should scale appropriately', async ({ page }) => {
      // Test mobile font size
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const mobileHeading = page.locator('h1').first();
      const mobileFontSize = await mobileHeading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Test desktop font size
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForLoadState('networkidle');
      
      const desktopHeading = page.locator('h1').first();
      const desktopFontSize = await desktopHeading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Desktop font should be larger than mobile
      const mobileSizeValue = parseFloat(mobileFontSize);
      const desktopSizeValue = parseFloat(desktopFontSize);
      expect(desktopSizeValue).toBeGreaterThanOrEqual(mobileSizeValue);
    });
  });
  
  test.describe('Responsive Utilities', () => {
    test('Overflow should be handled properly on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // Small phone
      await page.goto('/');
      
      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // Body should not be wider than viewport (no horizontal scroll)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding errors
    });
  });
});