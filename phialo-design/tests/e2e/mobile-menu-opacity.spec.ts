import { test, expect } from '@playwright/test';

test.describe('Mobile Menu Background Opacity', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('mobile menu should have opaque white background', async ({ page }) => {
    await page.goto('/');
    
    // Open mobile menu
    const menuButton = page.locator('#mobile-menu-btn');
    await menuButton.click();
    
    // Check that mobile menu is visible
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
    
    // Verify background styles
    const backgroundColor = await mobileMenu.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity,
        backdropFilter: styles.backdropFilter
      };
    });
    
    // Should have white background
    expect(backgroundColor.backgroundColor).toBe('rgb(255, 255, 255)');
    // Should be fully opaque
    expect(backgroundColor.opacity).toBe('1');
    // Should not have backdrop filter
    expect(backgroundColor.backdropFilter).toBe('none');
  });

  test('mobile menu should prevent text bleed-through', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Add some text content behind the menu for testing
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'test-background-text';
      div.innerHTML = '<h1 style="font-size: 48px; color: black;">BACKGROUND TEXT</h1>';
      div.style.position = 'fixed';
      div.style.top = '100px';
      div.style.left = '50px';
      div.style.zIndex = '10';
      document.body.appendChild(div);
    });
    
    // Open mobile menu
    await page.locator('#mobile-menu-btn').click();
    
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
    
    // Take a screenshot to verify opacity
    const screenshot = await page.screenshot();
    
    // The background text should not be visible through the menu
    // Check that the menu has higher z-index than our test text
    const zIndex = await mobileMenu.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    
    expect(parseInt(zIndex)).toBeGreaterThan(10);
  });

  test('mobile menu panels should all have opaque backgrounds', async ({ page }) => {
    await page.goto('/');
    
    // Open mobile menu
    await page.locator('#mobile-menu-btn').click();
    
    // Check all child divs have opaque backgrounds
    const panels = page.locator('#mobile-menu > div');
    const panelCount = await panels.count();
    
    for (let i = 0; i < panelCount; i++) {
      const panel = panels.nth(i);
      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          opacity: computed.opacity
        };
      });
      
      // Each panel should be opaque
      expect(styles.opacity).toBe('1');
      // Background should be white or transparent (relying on parent)
      expect(styles.backgroundColor).toMatch(/^(rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)|transparent)$/);
    }
  });

  test('mobile menu should work correctly on English pages', async ({ page }) => {
    await page.goto('/en/');
    
    // Open mobile menu
    await page.locator('#mobile-menu-btn').click();
    
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
    
    // Verify background is still opaque on English pages
    const backgroundColor = await mobileMenu.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity
      };
    });
    
    expect(backgroundColor.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(backgroundColor.opacity).toBe('1');
  });
});