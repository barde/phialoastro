import { test, expect } from '@playwright/test';

test.describe('Portfolio Modal Tests (Issue #22)', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Portfolio modal should display German text on German pages', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Click on first portfolio item
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    // Wait for modal to appear
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    
    // Check for German text
    await expect(modal.locator('[data-modal-category]')).toContainText(/Schmuck|3D Design|Skulptur/);
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
    await expect(modal.locator('[data-modal-technique-label]')).toContainText('Technik');
    
    // Check close button
    const closeButton = modal.locator('[data-modal-close]');
    await expect(closeButton).toHaveAttribute('aria-label', /Schließen|schließen/);
  });

  test('Portfolio modal should display English text on English pages', async ({ page }) => {
    await page.goto('/en/portfolio');
    
    // Click on first portfolio item
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    // Wait for modal to appear
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    
    // Check for English text
    await expect(modal.locator('[data-modal-category]')).toContainText(/Jewelry|3D Design|Sculpture/);
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
    await expect(modal.locator('[data-modal-technique-label]')).toContainText('Technique');
    
    // Check close button
    const closeButton = modal.locator('[data-modal-close]');
    await expect(closeButton).toHaveAttribute('aria-label', /Close|close/);
  });

  test('Modal should close when clicking close button', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Open modal
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    
    // Close modal
    const closeButton = modal.locator('[data-modal-close]');
    await closeButton.click();
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should close when clicking outside', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Open modal
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    
    // Click outside modal (on backdrop)
    await page.locator('[data-modal-backdrop]').click({ position: { x: 10, y: 10 } });
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should close when pressing Escape key', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Open modal
    const portfolioItem = page.locator('[data-portfolio-item]').first();
    await portfolioItem.click();
    
    const modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    await expect(modal).not.toBeVisible();
  });

  test('Modal should maintain language when navigating between items', async ({ page }) => {
    await page.goto('/en/portfolio');
    
    // Open first modal
    const firstItem = page.locator('[data-portfolio-item]').first();
    await firstItem.click();
    
    let modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Open second modal
    const secondItem = page.locator('[data-portfolio-item]').nth(1);
    await secondItem.click();
    
    modal = page.locator('[data-portfolio-modal]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-modal-material-label]')).toContainText('Material');
  });
});