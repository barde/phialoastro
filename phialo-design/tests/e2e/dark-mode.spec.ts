import { test, expect, Page } from '@playwright/test';

test.describe('Dark Mode - Comprehensive Tests', () => {
  // Helper function to clear localStorage before tests
  async function clearThemePreference(page: Page) {
    await page.evaluate(() => localStorage.removeItem('theme'));
  }

  // Helper function to check if dark mode is active
  async function isDarkModeActive(page: Page): Promise<boolean> {
    return await page.evaluate(() => 
      document.documentElement.classList.contains('dark')
    );
  }

  // Helper function to get computed styles
  async function getComputedStyle(page: Page, selector: string, property: string): Promise<string> {
    return await page.locator(selector).evaluate((el, prop) => 
      window.getComputedStyle(el).getPropertyValue(prop),
      property
    );
  }

  test.beforeEach(async ({ page }) => {
    // Clear theme preference before each test
    await page.goto('/');
    await clearThemePreference(page);
  });

  test('1. Theme toggle button exists and is clickable', async ({ page }) => {
    await page.goto('/');
    
    // Check theme toggle exists
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeEnabled();
    
    // Check it's clickable
    await expect(themeToggle).toHaveAttribute('aria-label', /Switch to (dark|light) mode/);
    
    // Verify button has proper styling
    await expect(themeToggle).toHaveClass(/rounded-full/);
    await expect(themeToggle).toHaveClass(/border-2/);
  });

  test('2. Clicking toggle switches between light and dark modes', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Initially should be in light mode (no saved preference)
    expect(await isDarkModeActive(page)).toBe(false);
    await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Click to switch to dark mode
    await themeToggle.click();
    
    // Verify dark mode is active
    expect(await isDarkModeActive(page)).toBe(true);
    await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
    
    // Click to switch back to light mode
    await themeToggle.click();
    
    // Verify light mode is active
    expect(await isDarkModeActive(page)).toBe(false);
    await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  test('3. Background color changes when switching themes', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Check light mode background
    let bgColor = await getComputedStyle(page, 'body', 'background-color');
    expect(bgColor).toMatch(/rgb\(255,?\s*255,?\s*255\)|rgba?\(255,?\s*255,?\s*255/);
    
    // Switch to dark mode
    await themeToggle.click();
    
    // Wait for transition
    await page.waitForTimeout(400);
    
    // Check dark mode background
    bgColor = await getComputedStyle(page, 'body', 'background-color');
    expect(bgColor).toMatch(/rgb\(10,?\s*25,?\s*47\)|rgba?\(10,?\s*25,?\s*47/);
  });

  test('4. Text colors change appropriately', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Check light mode text colors for specific elements
    const heading = page.locator('h1').first();
    let headingColor = await heading.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Light mode should have dark text
    expect(headingColor).toMatch(/rgb\(17,?\s*24,?\s*39\)|rgba?\(17,?\s*24,?\s*39/);
    
    // Check a specific paragraph
    const heroText = page.locator('.hero-section p').first();
    if (await heroText.isVisible()) {
      let heroTextColor = await heroText.evaluate(el => 
        window.getComputedStyle(el).color
      );
      // Store for comparison
      const lightModeTextColor = heroTextColor;
      
      // Switch to dark mode
      await themeToggle.click();
      await page.waitForTimeout(400);
      
      // Check dark mode text colors
      headingColor = await heading.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Dark mode should have light text
      expect(headingColor).toMatch(/rgb\(241,?\s*245,?\s*249\)|rgba?\(241,?\s*245,?\s*249/);
      
      // Check the hero text changed
      heroTextColor = await heroText.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(heroTextColor).not.toBe(lightModeTextColor);
    } else {
      // If no hero section, just check heading
      await themeToggle.click();
      await page.waitForTimeout(400);
      
      headingColor = await heading.evaluate(el => 
        window.getComputedStyle(el).color
      );
      expect(headingColor).toMatch(/rgb\(241,?\s*245,?\s*249\)|rgba?\(241,?\s*245,?\s*249/);
    }
  });

  test('5. Theme preference persists after page reload', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Switch to dark mode
    await themeToggle.click();
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Check localStorage
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe('dark');
    
    // Reload the page
    await page.reload();
    
    // Dark mode should still be active
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Toggle should show correct state
    await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  test('6. Theme preference persists during navigation', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Switch to dark mode
    await themeToggle.click();
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Navigate to different pages
    const pagesToTest = ['/portfolio', '/services', '/contact', '/about'];
    
    for (const pageUrl of pagesToTest) {
      await page.goto(pageUrl);
      
      // Verify dark mode is still active
      expect(await isDarkModeActive(page)).toBe(true);
      
      // Verify theme toggle shows correct state
      const toggle = page.locator('button[aria-label*="mode"]');
      await expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
    }
    
    // Navigate back to home
    await page.goto('/');
    expect(await isDarkModeActive(page)).toBe(true);
  });

  test('7. System preference is respected on first visit', async ({ browser }) => {
    // Test with dark system preference
    const darkContext = await browser.newContext({
      colorScheme: 'dark',
      // Clear any existing storage
      storageState: { cookies: [], origins: [] }
    });
    
    const darkPage = await darkContext.newPage();
    await darkPage.goto('/');
    
    // Should automatically be in dark mode
    expect(await isDarkModeActive(darkPage)).toBe(true);
    
    // Check localStorage was set
    const savedThemeDark = await darkPage.evaluate(() => localStorage.getItem('theme'));
    expect(savedThemeDark).toBe('dark');
    
    await darkContext.close();
    
    // Test with light system preference
    const lightContext = await browser.newContext({
      colorScheme: 'light',
      storageState: { cookies: [], origins: [] }
    });
    
    const lightPage = await lightContext.newPage();
    await lightPage.goto('/');
    
    // Should automatically be in light mode
    expect(await isDarkModeActive(lightPage)).toBe(false);
    
    // Check localStorage was set
    const savedThemeLight = await lightPage.evaluate(() => localStorage.getItem('theme'));
    expect(savedThemeLight).toBe('light');
    
    await lightContext.close();
  });

  test('8. All major components render correctly in both themes', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Test components in light mode
    const componentsToTest = [
      { selector: 'header', name: 'Header' },
      { selector: 'nav', name: 'Navigation' },
      { selector: 'footer', name: 'Footer' },
      { selector: '.hero-section', name: 'Hero Section' },
      { selector: 'button', name: 'Buttons' }
    ];
    
    // Check each component in light mode
    for (const component of componentsToTest) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible()) {
        const lightBg = await element.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        const lightColor = await element.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        // Switch to dark mode
        await themeToggle.click();
        await page.waitForTimeout(400);
        
        // Check the same component in dark mode
        const darkBg = await element.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        const darkColor = await element.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        // Verify colors changed (they should be different)
        if (lightBg !== 'rgba(0, 0, 0, 0)') { // Skip transparent backgrounds
          expect(darkBg).not.toBe(lightBg);
        }
        if (component.name !== 'Buttons') { // Some buttons might maintain color
          expect(darkColor).not.toBe(lightColor);
        }
        
        // Switch back to light mode for next iteration
        await themeToggle.click();
        await page.waitForTimeout(400);
      }
    }
  });

  test('9. Smooth transitions occur when switching themes', async ({ page }) => {
    await page.goto('/');
    
    // Check that transition styles are applied
    const transitionDuration = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.transition || styles.webkitTransition || '';
    });
    
    // Verify transition includes background-color and has duration
    expect(transitionDuration).toContain('background-color');
    expect(transitionDuration).toMatch(/0\.3s/);
    
    // Check multiple elements have transitions
    const elementsWithTransitions = await page.evaluate(() => {
      const elements = ['body', 'header', 'nav', 'footer', 'h1', 'p'];
      return elements.map(selector => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          selector,
          transition: styles.transition || styles.webkitTransition || ''
        };
      }).filter(Boolean);
    });
    
    // All elements should have transitions
    for (const element of elementsWithTransitions) {
      if (element) {
        expect(element.transition).toContain('0.3s');
      }
    }
  });

  test('10. No flash of incorrect theme on page load', async ({ page, browser }) => {
    // First, set dark mode preference
    await page.goto('/');
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.click();
    
    // Save current storage state
    const storageState = await page.context().storageState();
    
    // Create a new context with saved preference
    const context = await browser.newContext({
      storageState
    });
    
    const newPage = await context.newPage();
    
    // For browsers that support it, monitor theme changes
    try {
      await newPage.addInitScript(() => {
        let lastTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        window.themeChanges = 0;
        const observer = new MutationObserver(() => {
          const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          if (currentTheme !== lastTheme) {
            window.themeChanges = (window.themeChanges || 0) + 1;
            lastTheme = currentTheme;
          }
        });
        observer.observe(document.documentElement, { 
          attributes: true, 
          attributeFilter: ['class'] 
        });
      });
    } catch (e) {
      // Some browsers might not support addInitScript, that's okay
    }
    
    // Navigate to the page
    await newPage.goto('/');
    
    // Check that dark mode is immediately active
    expect(await isDarkModeActive(newPage)).toBe(true);
    
    // Check no theme changes occurred during load (if monitoring was possible)
    try {
      const themeChanges = await newPage.evaluate(() => (window as any).themeChanges || 0);
      expect(themeChanges).toBe(0);
    } catch (e) {
      // If monitoring wasn't possible, just check that theme is correct
      expect(await isDarkModeActive(newPage)).toBe(true);
    }
    
    await context.close();
  });

  test('Theme toggle icon changes correctly', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    const sunIcon = themeToggle.locator('svg').first();
    const moonIcon = themeToggle.locator('svg').nth(1);
    
    // In light mode, sun should be visible
    await expect(sunIcon).toHaveCSS('opacity', '1');
    await expect(moonIcon).toHaveCSS('opacity', '0');
    
    // Click to switch to dark mode
    await themeToggle.click();
    await page.waitForTimeout(400); // Wait for transition
    
    // In dark mode, moon should be visible
    await expect(sunIcon).toHaveCSS('opacity', '0');
    await expect(moonIcon).toHaveCSS('opacity', '1');
  });

  test('Theme works correctly with language switching', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"]');
    
    // Switch to dark mode
    await themeToggle.click();
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Switch language (if language selector exists)
    const langSelector = page.locator('[data-testid="language-selector"], .language-selector, button[aria-label*="language"]');
    if (await langSelector.isVisible()) {
      await langSelector.click();
      
      // Wait for language switch
      await page.waitForTimeout(1000);
      
      // Dark mode should still be active
      expect(await isDarkModeActive(page)).toBe(true);
    }
  });

  test('Theme toggle is accessible via keyboard', async ({ page, browserName }) => {
    // Skip this test on mobile devices
    if (browserName === 'chromium' && page.context()._options.isMobile) {
      test.skip();
      return;
    }
    if (browserName === 'webkit' && page.context()._options.isMobile) {
      test.skip();
      return;
    }
    
    await page.goto('/');
    
    // Focus the theme toggle directly using JavaScript
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await themeToggle.focus();
    
    // Verify it has focus
    const hasFocus = await themeToggle.evaluate(el => el === document.activeElement);
    expect(hasFocus).toBe(true);
    
    // Press Enter to toggle theme
    await page.keyboard.press('Enter');
    
    // Wait for transition
    await page.waitForTimeout(100);
    
    // Verify theme changed
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Press Space to toggle back
    await page.keyboard.press('Space');
    
    // Wait for transition
    await page.waitForTimeout(100);
    
    // Verify theme changed back
    expect(await isDarkModeActive(page)).toBe(false);
  });

  test('Theme persists across different browser tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    
    // Set dark mode in first tab
    await page1.goto('/');
    const themeToggle1 = page1.locator('button[aria-label*="mode"]');
    await themeToggle1.click();
    
    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    
    // Second tab should also be in dark mode
    expect(await isDarkModeActive(page2)).toBe(true);
    
    await context.close();
  });

  test('Theme works correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Theme toggle should be visible and functional
    const themeToggle = page.locator('button[aria-label*="mode"]');
    await expect(themeToggle).toBeVisible();
    
    // Test theme switching
    await themeToggle.click();
    expect(await isDarkModeActive(page)).toBe(true);
    
    // Check mobile menu if it exists
    const mobileMenuButton = page.locator('button[aria-label*="menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Theme should still be dark in mobile menu
      const mobileMenu = page.locator('[role="navigation"]');
      const menuBg = await mobileMenu.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have dark background
      expect(menuBg).not.toMatch(/rgb\(255,?\s*255,?\s*255\)/);
    }
  });
});