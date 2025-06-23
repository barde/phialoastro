import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.describe('Logo Navigation (Issue #21)', () => {
    test('Logo should navigate to German homepage from German pages', async ({ page }) => {
      await page.goto('/portfolio');
      
      const logo = page.locator('header a:has-text("PHIALO")');
      await expect(logo).toHaveAttribute('href', '/');
      
      await logo.click();
      await expect(page).toHaveURL('/');
    });

    test('Logo should navigate to English homepage from English pages', async ({ page }) => {
      await page.goto('/en/portfolio');
      
      const logo = page.locator('header a:has-text("PHIALO")');
      await expect(logo).toHaveAttribute('href', '/en/');
      
      await logo.click();
      await expect(page).toHaveURL('/en/');
    });

    test('Logo should have correct aria-label in both languages', async ({ page }) => {
      // German page
      await page.goto('/');
      let logo = page.locator('header a:has-text("PHIALO")');
      await expect(logo).toHaveAttribute('aria-label', 'Phialo Design Startseite');
      
      // English page
      await page.goto('/en/');
      logo = page.locator('header a:has-text("PHIALO")');
      await expect(logo).toHaveAttribute('aria-label', 'Phialo Design Homepage');
    });
  });

  test.describe('Language Selector', () => {
    test('@critical Should switch from German to English', async ({ page }) => {
      await page.goto('/');
      
      const langSelector = page.locator('[data-language-selector]');
      await langSelector.click();
      
      const englishOption = page.locator('a[href="/en/"]');
      await englishOption.click();
      
      await expect(page).toHaveURL('/en/');
    });

    test('Should switch from English to German', async ({ page }) => {
      await page.goto('/en/');
      
      const langSelector = page.locator('[data-language-selector]');
      await langSelector.click();
      
      const germanOption = page.locator('a[href="/"]');
      await germanOption.click();
      
      await expect(page).toHaveURL('/');
    });

    test('@critical Should maintain path when switching languages', async ({ page }) => {
      await page.goto('/portfolio');
      
      const langSelector = page.locator('[data-language-selector]');
      await langSelector.click();
      
      const englishOption = page.locator('a[href="/en/portfolio"]');
      await englishOption.click();
      
      await expect(page).toHaveURL('/en/portfolio');
    });
  });

  test.describe('Main Navigation', () => {
    test('@critical Should navigate to all main sections in German', async ({ page, isMobile }) => {
      await page.goto('/');
      
      // Open mobile menu if on mobile
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300); // Wait for menu animation
      }
      
      // Portfolio - use appropriate selector based on device
      const portfolioLink = isMobile 
        ? page.locator('nav a[href="/portfolio"], div[class*="fixed"] a[href="/portfolio"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/portfolio"]');
      await portfolioLink.click();
      await expect(page).toHaveURL('/portfolio');
      
      // Services
      await page.goto('/');
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const servicesLink = isMobile
        ? page.locator('nav a[href="/services"], div[class*="fixed"] a[href="/services"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/services"]');
      await servicesLink.click();
      await expect(page).toHaveURL('/services');
      
      // Tutorials
      await page.goto('/');
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const tutorialsLink = isMobile
        ? page.locator('nav a[href="/tutorials"], div[class*="fixed"] a[href="/tutorials"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/tutorials"]');
      await tutorialsLink.click();
      await expect(page).toHaveURL('/tutorials');
    });

    test('Should navigate to all main sections in English', async ({ page, isMobile }) => {
      await page.goto('/en/');
      
      // Open mobile menu if on mobile
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300); // Wait for menu animation
      }
      
      // Portfolio - use appropriate selector based on device
      const portfolioLink = isMobile 
        ? page.locator('nav a[href="/en/portfolio"], div[class*="fixed"] a[href="/en/portfolio"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/en/portfolio"]');
      await portfolioLink.click();
      await expect(page).toHaveURL('/en/portfolio');
      
      // Services
      await page.goto('/en/');
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const servicesLink = isMobile
        ? page.locator('nav a[href="/en/services"], div[class*="fixed"] a[href="/en/services"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/en/services"]');
      await servicesLink.click();
      await expect(page).toHaveURL('/en/services');
      
      // Tutorials
      await page.goto('/en/');
      if (isMobile) {
        const menuButton = page.locator('button[aria-label*="Men\u00fc"], button[aria-label*="menu"]').first();
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      const tutorialsLink = isMobile
        ? page.locator('nav a[href="/en/tutorials"], div[class*="fixed"] a[href="/en/tutorials"]').first()
        : page.locator('nav.hidden.lg\\:flex a[href="/en/tutorials"]');
      await tutorialsLink.click();
      await expect(page).toHaveURL('/en/tutorials');
    });
  });
});