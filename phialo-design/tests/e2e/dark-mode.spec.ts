import { test, expect } from '@playwright/test';

test.describe('Dark Mode Tests (Issue #12)', () => {
  test('Theme toggle button should be visible in header', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    await expect(themeToggle).toBeVisible();
  });

  test('Should toggle from light to dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Check initial light mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-light/);
    
    // Click theme toggle
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    await themeToggle.click();
    
    // Check dark mode is applied
    await expect(html).toHaveClass(/theme-dark/);
    
    // Check that dark mode colors are applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Dark mode should have dark background
    expect(backgroundColor).toMatch(/rgb\(10, 25, 47\)|rgba\(10, 25, 47/);
  });

  test('Should toggle from dark to light mode', async ({ page }) => {
    await page.goto('/');
    
    // First switch to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    await themeToggle.click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
    
    // Then switch back to light mode
    await themeToggle.click();
    await expect(html).toHaveClass(/theme-light/);
    
    // Check that light mode colors are applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Light mode should have white/light background
    expect(backgroundColor).toMatch(/rgb\(255, 255, 255\)|rgba\(255, 255, 255|white/);
  });

  test('Theme preference should persist across page navigation', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    await themeToggle.click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
    
    // Navigate to another page
    await page.goto('/portfolio');
    
    // Check dark mode is still active
    await expect(html).toHaveClass(/theme-dark/);
  });

  test('Theme toggle should show correct icon for current theme', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    
    // In light mode, sun icon should be visible
    const sunIcon = themeToggle.locator('svg').first();
    await expect(sunIcon).toHaveCSS('opacity', '1');
    
    // Click to switch to dark mode
    await themeToggle.click();
    
    // In dark mode, moon icon should be visible
    const moonIcon = themeToggle.locator('svg').nth(1);
    await expect(moonIcon).toHaveCSS('opacity', '1');
  });

  test('Theme should apply correct colors to all major elements', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark mode
    const themeToggle = page.locator('button[aria-label*="mode"], button[aria-label*="Mode"]');
    await themeToggle.click();
    
    // Check header
    const header = page.locator('header');
    const headerBg = await header.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(headerBg).not.toMatch(/rgb\(255, 255, 255\)|white/);
    
    // Check text colors
    const heading = page.locator('h1').first();
    const headingColor = await heading.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(headingColor).toMatch(/rgb\(241, 245, 249\)|rgba\(241, 245, 249/);
    
    // Check footer
    const footer = page.locator('footer');
    const footerBg = await footer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(footerBg).not.toMatch(/rgb\(255, 255, 255\)|white/);
  });

  test('Theme transition should be smooth', async ({ page }) => {
    await page.goto('/');
    
    const body = page.locator('body');
    
    // Check that transition is applied
    const transition = await body.evaluate(el => 
      window.getComputedStyle(el).transition
    );
    expect(transition).toContain('background-color');
    expect(transition).toContain('0.3s');
  });

  test('Theme should respect system preference on first visit', async ({ browser }) => {
    // Create context with dark color scheme preference
    const context = await browser.newContext({
      colorScheme: 'dark'
    });
    
    const page = await context.newPage();
    await page.goto('/');
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
    
    await context.close();
  });
});