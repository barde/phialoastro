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
    test('Should switch from German to English', async ({ page }) => {
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

    test('Should maintain path when switching languages', async ({ page }) => {
      await page.goto('/portfolio');
      
      const langSelector = page.locator('[data-language-selector]');
      await langSelector.click();
      
      const englishOption = page.locator('a[href="/en/portfolio"]');
      await englishOption.click();
      
      await expect(page).toHaveURL('/en/portfolio');
    });
  });

  test.describe('Main Navigation', () => {
    test('Should navigate to all main sections in German', async ({ page }) => {
      await page.goto('/');
      
      // Portfolio
      await page.locator('nav a[href="/portfolio"]').click();
      await expect(page).toHaveURL('/portfolio');
      
      // Services
      await page.goto('/');
      await page.locator('nav a[href="/services"]').click();
      await expect(page).toHaveURL('/services');
      
      // Tutorials
      await page.goto('/');
      await page.locator('nav a[href="/tutorials"]').click();
      await expect(page).toHaveURL('/tutorials');
    });

    test('Should navigate to all main sections in English', async ({ page }) => {
      await page.goto('/en/');
      
      // Portfolio
      await page.locator('nav a[href="/en/portfolio"]').click();
      await expect(page).toHaveURL('/en/portfolio');
      
      // Services
      await page.goto('/en/');
      await page.locator('nav a[href="/en/services"]').click();
      await expect(page).toHaveURL('/en/services');
      
      // Tutorials
      await page.goto('/en/');
      await page.locator('nav a[href="/en/tutorials"]').click();
      await expect(page).toHaveURL('/en/tutorials');
    });
  });
});