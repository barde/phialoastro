import { test, expect, Page } from '@playwright/test';

// Define all pages to test (both German and English versions)
const ALL_PAGES = [
  // German pages
  { path: '/', name: 'Home (DE)' },
  { path: '/portfolio', name: 'Portfolio (DE)' },
  { path: '/services', name: 'Services (DE)' },
  { path: '/tutorials', name: 'Tutorials (DE)' },
  { path: '/about', name: 'About (DE)' },
  { path: '/contact', name: 'Contact (DE)' },
  { path: '/imprint', name: 'Imprint (DE)' },
  { path: '/privacy', name: 'Privacy (DE)' },
  { path: '/terms', name: 'Terms (DE)' },
  
  // English pages
  { path: '/en/', name: 'Home (EN)' },
  { path: '/en/portfolio', name: 'Portfolio (EN)' },
  { path: '/en/services', name: 'Services (EN)' },
  { path: '/en/tutorials', name: 'Tutorials (EN)' },
  { path: '/en/about', name: 'About (EN)' },
  { path: '/en/contact', name: 'Contact (EN)' },
  { path: '/en/imprint', name: 'Imprint (EN)' },
  { path: '/en/privacy', name: 'Privacy (EN)' },
  { path: '/en/terms', name: 'Terms (EN)' },
];

// Expected colors for light and dark modes
const THEME_COLORS = {
  light: {
    body: /rgb\(255, 255, 255\)|rgba\(255, 255, 255|white/,
    header: /rgb\(255, 255, 255\)|rgba\(255, 255, 255|white|transparent|rgba\(0, 0, 0, 0\)/,
    text: /rgb\(10, 25, 47\)|rgba\(10, 25, 47|rgb\(51, 65, 85\)/,
    footer: /rgb\(10, 25, 47\)|rgba\(10, 25, 47/,
  },
  dark: {
    body: /rgb\(10, 25, 47\)|rgba\(10, 25, 47/,
    header: /rgb\(10, 25, 47\)|rgba\(10, 25, 47|rgb\(15, 23, 42\)|transparent|rgba\(0, 0, 0, 0\)/,
    text: /rgb\(241, 245, 249\)|rgba\(241, 245, 249|rgb\(226, 232, 240\)/,
    footer: /rgb\(15, 23, 42\)|rgba\(15, 23, 42/,
  }
};

// Helper function to verify theme colors
async function verifyThemeColors(page: Page, theme: 'light' | 'dark') {
  const colors = THEME_COLORS[theme];
  
  // Check body background
  const body = page.locator('body');
  const bodyBg = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bodyBg).toMatch(colors.body);
  
  // Check header background
  const header = page.locator('header');
  if (await header.count() > 0) {
    const headerBg = await header.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(headerBg).toMatch(colors.header);
  }
  
  // Check text color
  const heading = page.locator('h1, h2').first();
  if (await heading.count() > 0) {
    const headingColor = await heading.evaluate(el => window.getComputedStyle(el).color);
    expect(headingColor).toMatch(colors.text);
  }
  
  // Check footer background
  const footer = page.locator('footer');
  if (await footer.count() > 0) {
    const footerBg = await footer.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(footerBg).toMatch(colors.footer);
  }
}

// Helper function to toggle theme
async function toggleTheme(page: Page) {
  const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"], button:has(svg[class*="sun"]), button:has(svg[class*="moon"])');
  await themeToggle.click();
  await page.waitForTimeout(500); // Wait for transition
}

test.describe('Comprehensive Dark Mode Tests', () => {
  test('Theme toggle works on all pages', async ({ page }) => {
    for (const pageInfo of ALL_PAGES) {
      await test.step(`Testing ${pageInfo.name}`, async () => {
        await page.goto(pageInfo.path);
        
        // Verify initial light mode
        const html = page.locator('html');
        await expect(html).toHaveAttribute('data-theme', 'light');
        await verifyThemeColors(page, 'light');
        
        // Toggle to dark mode
        await toggleTheme(page);
        await expect(html).toHaveAttribute('data-theme', 'dark');
        await verifyThemeColors(page, 'dark');
        
        // Toggle back to light mode
        await toggleTheme(page);
        await expect(html).toHaveAttribute('data-theme', 'light');
        await verifyThemeColors(page, 'light');
      });
    }
  });

  test('Theme persists across navigation', async ({ page }) => {
    // Start on home page and switch to dark mode
    await page.goto('/');
    await toggleTheme(page);
    
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    
    // Navigate through multiple pages
    const navigationPaths = ['/portfolio', '/services', '/tutorials', '/contact', '/en/', '/en/portfolio'];
    
    for (const path of navigationPaths) {
      await test.step(`Navigating to ${path}`, async () => {
        await page.goto(path);
        
        // Verify dark mode is still active
        await expect(html).toHaveAttribute('data-theme', 'dark');
        await verifyThemeColors(page, 'dark');
      });
    }
  });

  test('All navigation links work in both themes', async ({ page }) => {
    await page.goto('/');
    
    // Test in light mode
    await test.step('Testing navigation in light mode', async () => {
      // Desktop navigation
      const navLinks = page.locator('nav a[href]:not([href^="http"])');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        if (href && !href.includes('#')) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await verifyThemeColors(page, 'light');
          await page.goBack();
        }
      }
    });
    
    // Switch to dark mode and test again
    await toggleTheme(page);
    
    await test.step('Testing navigation in dark mode', async () => {
      const navLinks = page.locator('nav a[href]:not([href^="http"])');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        if (href && !href.includes('#')) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await verifyThemeColors(page, 'dark');
          await page.goBack();
        }
      }
    });
  });

  test('Mobile menu works in both themes', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test in light mode
    await test.step('Mobile menu in light mode', async () => {
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
      await menuButton.click();
      
      const mobileMenu = page.locator('nav[class*="mobile"], div[class*="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Check mobile menu background
      const menuBg = await mobileMenu.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(menuBg).toMatch(THEME_COLORS.light.body);
    });
    
    // Close menu and switch to dark mode
    await page.click('body'); // Click outside to close
    await page.waitForTimeout(300);
    await toggleTheme(page);
    
    // Test in dark mode
    await test.step('Mobile menu in dark mode', async () => {
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
      await menuButton.click();
      
      const mobileMenu = page.locator('nav[class*="mobile"], div[class*="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Check mobile menu background
      const menuBg = await mobileMenu.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(menuBg).toMatch(THEME_COLORS.dark.body);
    });
  });

  test('Interactive elements maintain proper contrast in both themes', async ({ page }) => {
    await page.goto('/');
    
    // Test buttons and links in light mode
    await test.step('Check contrast in light mode', async () => {
      const buttons = page.locator('button:visible').first();
      const links = page.locator('a:visible').first();
      
      if (await buttons.count() > 0) {
        const buttonColor = await buttons.evaluate(el => window.getComputedStyle(el).color);
        const buttonBg = await buttons.evaluate(el => window.getComputedStyle(el).backgroundColor);
        
        // Ensure button has sufficient contrast
        expect(buttonColor).not.toBe(buttonBg);
      }
      
      if (await links.count() > 0) {
        const linkColor = await links.evaluate(el => window.getComputedStyle(el).color);
        expect(linkColor).toBeTruthy();
      }
    });
    
    // Switch to dark mode and test again
    await toggleTheme(page);
    
    await test.step('Check contrast in dark mode', async () => {
      const buttons = page.locator('button:visible').first();
      const links = page.locator('a:visible').first();
      
      if (await buttons.count() > 0) {
        const buttonColor = await buttons.evaluate(el => window.getComputedStyle(el).color);
        const buttonBg = await buttons.evaluate(el => window.getComputedStyle(el).backgroundColor);
        
        // Ensure button has sufficient contrast
        expect(buttonColor).not.toBe(buttonBg);
      }
      
      if (await links.count() > 0) {
        const linkColor = await links.evaluate(el => window.getComputedStyle(el).color);
        expect(linkColor).toBeTruthy();
      }
    });
  });

  test('Theme toggle icon updates correctly', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"], button:has(svg)').first();
    
    // In light mode, check for sun icon or appropriate aria-label
    const initialLabel = await themeToggle.getAttribute('aria-label');
    expect(initialLabel).toContain('dark');
    
    // Switch to dark mode
    await toggleTheme(page);
    
    // In dark mode, check for moon icon or appropriate aria-label
    const darkLabel = await themeToggle.getAttribute('aria-label');
    expect(darkLabel).toContain('light');
  });

  test('Theme works with language switching', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode
    await toggleTheme(page);
    
    // Switch to English
    await page.goto('/en/');
    
    // Verify dark mode is maintained
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await verifyThemeColors(page, 'dark');
    
    // Switch back to German
    await page.goto('/');
    
    // Verify dark mode is still maintained
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await verifyThemeColors(page, 'dark');
  });

  test('Special sections adapt to theme', async ({ page }) => {
    // Test portfolio page with images
    await page.goto('/portfolio');
    await toggleTheme(page);
    
    // Check that portfolio items have proper styling in dark mode
    const portfolioItems = page.locator('.portfolio-item, article[class*="portfolio"]');
    if (await portfolioItems.count() > 0) {
      const itemBg = await portfolioItems.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(itemBg).not.toMatch(/rgb\(255, 255, 255\)|white/);
    }
    
    // Test tutorials page
    await page.goto('/tutorials');
    
    const tutorialCards = page.locator('.tutorial-card, article[class*="tutorial"]');
    if (await tutorialCards.count() > 0) {
      const cardBg = await tutorialCards.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(cardBg).not.toMatch(/rgb\(255, 255, 255\)|white/);
    }
  });
});

// Run accessibility tests in both themes
test.describe('Dark Mode Accessibility', () => {
  test('Maintains WCAG AA contrast in both themes', async ({ page }) => {
    const { AxeBuilder } = require('axe-playwright');
    
    await page.goto('/');
    
    // Test light mode accessibility
    const lightResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(lightResults.violations.filter(v => v.id.includes('contrast'))).toHaveLength(0);
    
    // Switch to dark mode
    await toggleTheme(page);
    
    // Test dark mode accessibility
    const darkResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(darkResults.violations.filter(v => v.id.includes('contrast'))).toHaveLength(0);
  });
});