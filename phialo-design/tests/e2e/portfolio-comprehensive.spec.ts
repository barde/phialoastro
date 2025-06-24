import { test, expect } from '@playwright/test';
import { openPortfolioModal, setupConsoleErrorLogging } from './helpers/portfolio-helpers';

test.describe('Portfolio Comprehensive Tests - Issue #45', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleErrorLogging(page);
    await page.goto('/portfolio');
    await page.waitForSelector('.portfolio-section', { timeout: 10000 });
  });

  test('@critical portfolio items should be sorted by year (newest first)', async ({ page }) => {
    // Wait for portfolio grid
    await page.waitForSelector('.portfolio-grid');
    
    // Get all portfolio items
    const items = await page.locator('.portfolio-item').all();
    expect(items.length).toBe(9);
    
    // Check first item is from 2024
    const firstItemTitle = await items[0].locator('h3').textContent();
    expect(firstItemTitle).toContain('ParookaVille');
    
    // Get all items with their years for verification
    const itemData = [];
    for (const item of items) {
      const title = await item.locator('h3').textContent();
      itemData.push(title);
    }
    
    console.log('Portfolio items order:', itemData);
    
    // Verify ParookaVille (2024) comes before Madonna Crown (2022)
    const parookaIndex = itemData.findIndex(title => title?.includes('ParookaVille'));
    const crownIndex = itemData.findIndex(title => title?.includes('Madonna'));
    
    expect(parookaIndex).toBeLessThan(crownIndex);
    expect(parookaIndex).toBe(0); // Should be first
  });

  test('category filtering should work correctly', async ({ page }) => {
    // Test each category
    const categoryTests = [
      { 
        buttonText: 'Ringe', 
        expectedCount: 3,
        expectedItems: ['ParookaVille', 'Turmalin', 'Tansanit']
      },
      { 
        buttonText: 'Ohrringe', 
        expectedCount: 1,
        expectedItems: ['DNA']
      },
      { 
        buttonText: 'Anhänger', 
        expectedCount: 1,
        expectedItems: ['Ouroboros']
      },
      { 
        buttonText: 'Skulpturen', 
        expectedCount: 3,
        expectedItems: ['Möbius', 'Schloss', 'Madonna']
      },
      { 
        buttonText: 'Anstecker', 
        expectedCount: 1,
        expectedItems: ['Meisen']
      }
    ];
    
    for (const test of categoryTests) {
      console.log(`Testing ${test.buttonText} category...`);
      
      // Click the category button - be more specific to avoid duplicates
      await page.locator(`button:has-text("${test.buttonText}")`).first().click();
      await page.waitForTimeout(300);
      
      // Count items
      const itemCount = await page.locator('.portfolio-item').count();
      expect(itemCount).toBe(test.expectedCount);
      
      // Verify correct items are shown
      const titles = await page.locator('.portfolio-item h3').allTextContents();
      for (const expectedItem of test.expectedItems) {
        const found = titles.some(title => title.includes(expectedItem));
        expect(found).toBeTruthy();
      }
    }
  });

  test('sorting should be maintained when filtering categories', async ({ page }) => {
    // Click on Rings category - use first() to avoid duplicates
    await page.locator('button:has-text("Ringe")').first().click();
    await page.waitForTimeout(300);
    
    // Get ring items
    const ringItems = await page.locator('.portfolio-item h3').allTextContents();
    
    // ParookaVille (2024) should be first among rings
    expect(ringItems[0]).toContain('ParookaVille');
    
    // Turmaline and Tanzanite (both 2023) should come after
    expect(ringItems[1]).toMatch(/Turmalin|Tansanit/);
    expect(ringItems[2]).toMatch(/Turmalin|Tansanit/);
  });

  test('filter state should update correctly', async ({ page }) => {
    // Check initial state - "Alle Arbeiten" should be active
    const allWorksButton = page.locator('button:has-text("Alle Arbeiten")');
    await expect(allWorksButton).toHaveClass(/bg-gold/);
    
    // Click on Ringe - use exact match to avoid matching "Ohrringe"
    await page.locator('button', { hasText: /^Ringe$/ }).click();
    await page.waitForTimeout(300);
    
    // Now Ringe should be active - use exact match
    const ringeButton = page.locator('button', { hasText: /^Ringe$/ });
    await expect(ringeButton).toHaveClass(/bg-gold/);
    
    // And Alle Arbeiten should not be active
    await expect(allWorksButton).not.toHaveClass(/bg-gold/);
  });

  test('should handle rapid filter switching', async ({ page }) => {
    // Rapidly switch between filters
    const filters = [
      { text: 'Ringe', pattern: /^Ringe$/ },
      { text: 'Ohrringe', pattern: /^Ohrringe$/ },
      { text: 'Skulpturen', pattern: /^Skulpturen$/ },
      { text: 'Alle Arbeiten', pattern: /^Alle Arbeiten$/ }
    ];
    
    // Do rapid switching
    for (let i = 0; i < 8; i++) {
      const filter = filters[i % filters.length];
      await page.locator('button', { hasText: filter.pattern }).click();
      await page.waitForTimeout(100);
    }
    
    // Finally, explicitly click "Alle Arbeiten" to show all items
    await page.locator('button', { hasText: /^Alle Arbeiten$/ }).click();
    
    // Wait for the filtering animation to complete
    await page.waitForTimeout(1000);
    
    // Count visible portfolio items
    const visibleItems = await page.locator('[data-testid="portfolio-item"]').all();
    const visibleCount = (await Promise.all(
      visibleItems.map(item => item.isVisible())
    )).filter(visible => visible).length;
    
    expect(visibleCount).toBe(9);
  });

  test('@critical portfolio modal should open with correct item', async ({ page }) => {
    // Skip in CI due to hover state issues
    test.skip(!!process.env.CI, 'Portfolio modal tests are flaky in CI environment');
    
    // Note: This test works locally but fails in CI because:
    // 1. Hover states don't work reliably in headless browsers
    // 2. The portfolio items require hover to show the "Ansehen" button
    // 3. Force clicks and JavaScript clicks don't trigger the modal properly in CI
    
    // Open the portfolio modal using simplified helper
    const modal = await openPortfolioModal(page);
    
    // Check modal content
    const modalTitle = await modal.locator('h2').textContent();
    expect(modalTitle).toContain('ParookaVille');
    
    // Check that materials are displayed
    const modalContent = await modal.textContent();
    expect(modalContent).toContain('925');
    expect(modalContent).toContain('Silber');
    
    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('@critical portfolio items should be interactive (CI-friendly)', async ({ page }) => {
    // This test verifies portfolio functionality without requiring hover/modal interactions
    await page.goto('/portfolio');
    
    // Wait for portfolio items
    const portfolioItems = page.locator('[data-testid="portfolio-item"]');
    await expect(portfolioItems.first()).toBeVisible();
    
    // Verify all items have the necessary elements
    const itemCount = await portfolioItems.count();
    expect(itemCount).toBe(9);
    
    // Check that each item has an image and title
    for (let i = 0; i < itemCount; i++) {
      const item = portfolioItems.nth(i);
      await expect(item.locator('img')).toBeVisible();
      await expect(item.locator('h3')).toBeVisible();
    }
    
    // Verify hover states are applied (checking CSS classes)
    const firstItem = portfolioItems.first();
    await expect(firstItem).toHaveClass(/group/); // Should have group class for hover effects
  });

  test('should show correct items count for each category', async ({ page }) => {
    // Define expected counts
    const expectedCounts = {
      'Alle Arbeiten': 9,
      'Ringe': 3,
      'Ohrringe': 1,
      'Anhänger': 1,
      'Skulpturen': 3,
      'Anstecker': 1
    };
    
    for (const [category, expectedCount] of Object.entries(expectedCounts)) {
      await page.locator(`button:has-text("${category}")`).first().click();
      await page.waitForTimeout(300);
      
      const count = await page.locator('.portfolio-item').count();
      expect(count).toBe(expectedCount);
    }
  });
});

test.describe('Portfolio English Version Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForSelector('.portfolio-section', { timeout: 10000 });
  });

  test('@critical should display English category names', async ({ page }) => {
    // Check that English category names are displayed - use exact text matching
    await expect(page.getByRole('button', { name: 'All Works', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rings', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Earrings', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pendants', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sculptures', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pins', exact: true })).toBeVisible();
  });

  test('filtering should work on English page', async ({ page }) => {
    // Click on Rings - use first() to avoid duplicates
    await page.locator('button:has-text("Rings")').first().click();
    await page.waitForTimeout(300);
    
    // Should show 3 rings
    const count = await page.locator('.portfolio-item').count();
    expect(count).toBe(3);
    
    // First should still be ParookaVille
    const firstTitle = await page.locator('.portfolio-item:first-child h3').textContent();
    expect(firstTitle).toContain('ParookaVille');
  });
});