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
      
      // Click the English button in the language selector
      const englishButton = page.locator('[data-language-selector] button[data-lang="en"]');
      await englishButton.click();
      
      await expect(page).toHaveURL('/en/');
    });

    test('Should switch from English to German', async ({ page }) => {
      await page.goto('/en/');
      
      // Click the German button in the language selector
      const germanButton = page.locator('[data-language-selector] button[data-lang="de"]');
      await germanButton.click();
      
      await expect(page).toHaveURL('/');
    });

    test('@critical Should maintain path when switching languages', async ({ page }) => {
      await page.goto('/portfolio');
      
      // Click the English button in the language selector
      const englishButton = page.locator('[data-language-selector] button[data-lang="en"]');
      await englishButton.click();
      
      await expect(page).toHaveURL(/\/en\/portfolio\/?/);
    });
  });

  test.describe('Main Navigation', () => {
    test('@critical Should navigate to all main sections in German', async ({ page, isMobile }) => {
      await page.goto('/');
      
      // Open mobile menu if on mobile
      if (isMobile) {
        // Use data-testid for reliable selection
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
      }
      
      // Portfolio - use data-testid for mobile
      if (isMobile) {
        // For mobile, use data-testid
        const portfolioLink = page.locator('[data-testid="mobile-nav-portfolio"]');
        await portfolioLink.click();
      } else {
        // For desktop, use the nav link
        const portfolioLink = page.locator('nav.hidden.lg\\:flex a[href="/portfolio"]');
        await portfolioLink.click();
      }
      await expect(page).toHaveURL('/portfolio');
      
      // Services
      await page.goto('/');
      if (isMobile) {
        // Use data-testid for menu button
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
        // For mobile, use data-testid
        const servicesLink = page.locator('[data-testid="mobile-nav-services"]');
        await servicesLink.click();
      } else {
        // For desktop, use the nav link
        const servicesLink = page.locator('nav.hidden.lg\\:flex a[href="/services"]');
        await servicesLink.click();
      }
      await expect(page).toHaveURL('/services');
      
      // Tutorials
      await page.goto('/');
      if (isMobile) {
        // Use data-testid for menu button
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
        // For mobile, use data-testid
        const tutorialsLink = page.locator('[data-testid="mobile-nav-tutorials"]');
        await tutorialsLink.click();
      } else {
        // For desktop, use the nav link
        const tutorialsLink = page.locator('nav.hidden.lg\\:flex a[href="/tutorials"]');
        await tutorialsLink.click();
      }
      await expect(page).toHaveURL('/tutorials');
    });

    test('Should navigate to all main sections in English', async ({ page, isMobile }) => {
      await page.goto('/en/');
      
      // Open mobile menu if on mobile
      if (isMobile) {
        // Use data-testid for reliable selection
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
      }
      
      // Portfolio - use data-testid for mobile
      if (isMobile) {
        // For mobile, use data-testid
        const portfolioLink = page.locator('[data-testid="mobile-nav-portfolio"]');
        await portfolioLink.click();
      } else {
        // For desktop, use the nav link
        const portfolioLink = page.locator('nav.hidden.lg\\:flex a[href="/en/portfolio"]');
        await portfolioLink.click();
      }
      await expect(page).toHaveURL('/en/portfolio');
      
      // Services
      await page.goto('/en/');
      if (isMobile) {
        // Use data-testid for menu button
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
        // For mobile, use data-testid
        const servicesLink = page.locator('[data-testid="mobile-nav-services"]');
        await servicesLink.click();
      } else {
        // For desktop, use the nav link
        const servicesLink = page.locator('nav.hidden.lg\\:flex a[href="/en/services"]');
        await servicesLink.click();
      }
      await expect(page).toHaveURL('/en/services');
      
      // Tutorials
      await page.goto('/en/');
      if (isMobile) {
        // Use data-testid for menu button
        const menuButton = page.locator('[data-testid="mobile-menu-button"]');
        await menuButton.click();
        // Wait for mobile menu panel to be visible
        await page.waitForSelector('[data-testid="mobile-menu-panel"]', { state: 'visible' });
        // For mobile, use data-testid
        const tutorialsLink = page.locator('[data-testid="mobile-nav-tutorials"]');
        await tutorialsLink.click();
      } else {
        // For desktop, use the nav link
        const tutorialsLink = page.locator('nav.hidden.lg\\:flex a[href="/en/tutorials"]');
        await tutorialsLink.click();
      }
      await expect(page).toHaveURL('/en/tutorials');
    });
  });
});