import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile Navigation', () => {
    test.use(devices['iPhone 12']);
    
    test('Mobile menu should be functional', async ({ page }) => {
      await page.goto('/');
      
      // Check if mobile menu button is visible
      const menuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]');
      await expect(menuButton).toBeVisible();
      
      // Open mobile menu
      await menuButton.click();
      
      // Check navigation items are visible
      const navItems = page.locator('nav a');
      const navCount = await navItems.count();
      expect(navCount).toBeGreaterThan(0);
      
      // Navigation items should be accessible
      for (let i = 0; i < navCount; i++) {
        await expect(navItems.nth(i)).toBeVisible();
      }
    });
    
    test('Theme toggle should work on mobile', async ({ page }) => {
      await page.goto('/');
      
      const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
      await expect(themeToggle).toBeVisible();
      
      // Toggle theme
      await themeToggle.click();
      
      const html = page.locator('html');
      await expect(html).toHaveClass(/theme-dark/);
    });
  });

  test.describe('Tablet View', () => {
    test.use({
      viewport: { width: 768, height: 1024 }
    });
    
    test('Layout should adapt for tablet screens', async ({ page }) => {
      await page.goto('/');
      
      // Header should be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Content should be properly sized
      const mainContent = page.locator('main');
      const contentWidth = await mainContent.evaluate(el => el.offsetWidth);
      expect(contentWidth).toBeLessThanOrEqual(768);
      expect(contentWidth).toBeGreaterThan(600);
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1920, height: 1080 }
    });
    
    test('Desktop navigation should show all items', async ({ page }) => {
      await page.goto('/');
      
      // All navigation items should be visible
      const navItems = page.locator('nav a[href*="portfolio"], nav a[href*="services"], nav a[href*="tutorials"]');
      const count = await navItems.count();
      expect(count).toBeGreaterThanOrEqual(3);
      
      for (let i = 0; i < count; i++) {
        await expect(navItems.nth(i)).toBeVisible();
      }
      
      // CTA button should be visible on desktop
      const ctaButton = page.locator('header a:has-text("Projekt anfragen"), header a:has-text("Request Project")');
      await expect(ctaButton).toBeVisible();
    });
  });

  test('Images should be responsive', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const width = await img.evaluate(el => el.offsetWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // Images should not exceed viewport width
      expect(width).toBeLessThanOrEqual(viewportWidth);
    }
  });

  test('Text should be readable on all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },  // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      const heading = page.locator('h1').first();
      const fontSize = await heading.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      const fontSizeNum = parseFloat(fontSize);
      
      // Font size should be appropriate for viewport
      if (viewport.width < 768) {
        expect(fontSizeNum).toBeGreaterThanOrEqual(24); // Mobile
      } else if (viewport.width < 1024) {
        expect(fontSizeNum).toBeGreaterThanOrEqual(36); // Tablet
      } else {
        expect(fontSizeNum).toBeGreaterThanOrEqual(48); // Desktop
      }
    }
  });
});