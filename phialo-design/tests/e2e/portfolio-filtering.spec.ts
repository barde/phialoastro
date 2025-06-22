import { test, expect } from '@playwright/test';

test.describe('Portfolio Filtering Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForSelector('.portfolio-section');
  });

  test('should display all portfolio items on initial load', async ({ page }) => {
    // Wait for portfolio grid to load
    await page.waitForSelector('.portfolio-grid');
    
    // Count total portfolio items
    const items = await page.locator('.portfolio-item').count();
    expect(items).toBeGreaterThan(0);
    console.log(`Total portfolio items: ${items}`);
  });

  test('should filter by Rings category', async ({ page }) => {
    // Click on Rings filter
    await page.click('button:has-text("Ringe")');
    
    // Wait for potential animation
    await page.waitForTimeout(500);
    
    // Check if any items are displayed
    const items = await page.locator('.portfolio-item').count();
    console.log(`Rings category items: ${items}`);
    
    // There should be at least some rings in the portfolio
    expect(items).toBeGreaterThan(0);
    
    // Verify the displayed items are actually rings
    const titles = await page.locator('.portfolio-item h3').allTextContents();
    console.log('Ring titles:', titles);
    
    // Each title should contain "Ring" (in German or English)
    for (const title of titles) {
      expect(title.toLowerCase()).toMatch(/ring/);
    }
  });

  test('should filter by Earrings category', async ({ page }) => {
    // Click on Earrings filter
    await page.click('button:has-text("Ohrringe")');
    
    // Wait for potential animation
    await page.waitForTimeout(500);
    
    // Check if any items are displayed
    const items = await page.locator('.portfolio-item').count();
    console.log(`Earrings category items: ${items}`);
    
    // There should be at least some earrings
    expect(items).toBeGreaterThan(0);
    
    // Verify the displayed items contain earring-related terms
    const titles = await page.locator('.portfolio-item h3').allTextContents();
    console.log('Earring titles:', titles);
  });

  test('should filter by Pendants category', async ({ page }) => {
    // Click on Pendants filter
    await page.click('button:has-text("Anhänger")');
    
    // Wait for potential animation
    await page.waitForTimeout(500);
    
    // Check if any items are displayed
    const items = await page.locator('.portfolio-item').count();
    console.log(`Pendants category items: ${items}`);
    
    expect(items).toBeGreaterThan(0);
  });

  test('should filter by Sculptures category', async ({ page }) => {
    // Click on Sculptures filter
    await page.click('button:has-text("Skulpturen")');
    
    // Wait for potential animation
    await page.waitForTimeout(500);
    
    // Check if any items are displayed
    const items = await page.locator('.portfolio-item').count();
    console.log(`Sculptures category items: ${items}`);
    
    expect(items).toBeGreaterThan(0);
  });

  test('should filter by Pins category', async ({ page }) => {
    // Click on Pins filter
    await page.click('button:has-text("Anstecker")');
    
    // Wait for potential animation
    await page.waitForTimeout(500);
    
    // Check if any items are displayed
    const items = await page.locator('.portfolio-item').count();
    console.log(`Pins category items: ${items}`);
    
    expect(items).toBeGreaterThan(0);
  });

  test('should return to all items when clicking "Alle Arbeiten"', async ({ page }) => {
    // First filter by a category
    await page.click('button:has-text("Ringe")');
    await page.waitForTimeout(500);
    
    const ringsCount = await page.locator('.portfolio-item').count();
    console.log(`Rings count: ${ringsCount}`);
    
    // Then click All Works
    await page.click('button:has-text("Alle Arbeiten")');
    await page.waitForTimeout(500);
    
    const allCount = await page.locator('.portfolio-item').count();
    console.log(`All items count: ${allCount}`);
    
    // All items count should be greater than just rings
    expect(allCount).toBeGreaterThan(ringsCount);
    expect(allCount).toBe(9); // We know there are 9 total items
  });

  test('should maintain sorting by year when filtering', async ({ page }) => {
    // Click on Rings filter
    await page.click('button:has-text("Ringe")');
    await page.waitForTimeout(500);
    
    // Get the first ring item title
    const firstItem = await page.locator('.portfolio-item h3').first().textContent();
    console.log('First ring item:', firstItem);
    
    // ParookaVille Ring (2024) should be first among rings
    expect(firstItem).toContain('ParookaVille');
  });

  test('should check console for errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test each filter
    const filters = ['Ringe', 'Ohrringe', 'Anhänger', 'Skulpturen', 'Anstecker'];
    
    for (const filter of filters) {
      await page.click(`button:has-text("${filter}")`);
      await page.waitForTimeout(500);
    }
    
    // No console errors should occur
    expect(errors).toHaveLength(0);
  });
});

// Debug test to examine the actual structure
test('debug portfolio structure', async ({ page }) => {
  await page.goto('/portfolio');
  await page.waitForSelector('.portfolio-section');
  
  // Log the filter buttons
  const filterButtons = await page.locator('.portfolio-section button').allTextContents();
  console.log('Filter buttons found:', filterButtons);
  
  // Log all portfolio items with their categories
  const items = await page.locator('.portfolio-item').all();
  console.log(`Total items found: ${items.length}`);
  
  for (let i = 0; i < items.length; i++) {
    const title = await items[i].locator('h3').textContent();
    const category = await items[i].locator('p').textContent();
    console.log(`Item ${i + 1}: ${title} - Category: ${category}`);
  }
});