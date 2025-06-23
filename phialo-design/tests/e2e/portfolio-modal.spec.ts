import { test, expect } from '@playwright/test';
import { waitForPortfolioLoad, clickPortfolioItem, closePortfolioModal, waitForHydration } from './helpers/test-utils';

test.describe('Portfolio Modal Tests (Issue #22)', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Portfolio modal should display German text on German pages', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForHydration(page);
    
    // Click on first portfolio item
    await clickPortfolioItem(page, 0);
    
    // Wait for modal to appear
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for German text in modal content
    const modalText = await modal.textContent();
    
    // Check for German UI elements
    expect(modalText).toMatch(/Material|Technik|Jahr/);
    
    // Check close button has German aria-label
    const closeButton = page.locator('[data-testid="modal-close"]');
    const ariaLabel = await closeButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Modal schließen/i);
  });

  test('Portfolio modal should display English text on English pages', async ({ page }) => {
    await page.goto('/en/portfolio');
    await waitForHydration(page);
    
    // Click on first portfolio item
    await clickPortfolioItem(page, 0);
    
    // Wait for modal to appear
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for English text in modal content
    const modalText = await modal.textContent();
    
    // Check for English UI elements
    expect(modalText).toMatch(/Material|Technique|Year/);
    
    // Check close button has English aria-label
    const closeButton = page.locator('[data-testid="modal-close"]');
    const ariaLabel = await closeButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Close modal/i);
  });

  test('Modal should close when clicking close button', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForHydration(page);
    
    // Open modal
    await clickPortfolioItem(page, 0);
    
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Close modal using helper
    await closePortfolioModal(page);
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should close when clicking outside', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForHydration(page);
    
    // Open modal
    await clickPortfolioItem(page, 0);
    
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Click on backdrop at a specific position (top-left corner) to avoid modal content
    await page.mouse.click(10, 10);
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should close when pressing Escape key', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForHydration(page);
    
    // Open modal
    await clickPortfolioItem(page, 0);
    
    const modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should maintain language when navigating between items', async ({ page }) => {
    await page.goto('/en/portfolio');
    await waitForHydration(page);
    
    // Open first modal
    await clickPortfolioItem(page, 0);
    
    let modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Check English content
    let modalText = await modal.textContent();
    expect(modalText).toMatch(/Material|Technique|Year/);
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    
    // Open second modal
    await clickPortfolioItem(page, 1);
    
    modal = page.locator('[data-testid="portfolio-modal"]');
    await expect(modal).toBeVisible();
    
    // Check English content is maintained
    modalText = await modal.textContent();
    expect(modalText).toMatch(/Material|Technique|Year/);
  });
});