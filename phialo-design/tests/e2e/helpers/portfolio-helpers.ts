import { Page, expect } from '@playwright/test';

/**
 * Simplified and more robust portfolio interaction helpers
 */

export async function openPortfolioModal(page: Page) {
  // Navigate to portfolio if not already there
  if (!page.url().includes('/portfolio')) {
    await page.goto('/portfolio');
  }
  
  // Wait for page to stabilize
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Wait for any animations/hydration
  
  // Get the first portfolio item
  const firstItem = page.locator('[data-testid="portfolio-item"]').first();
  
  // Ensure it's visible and in viewport
  await expect(firstItem).toBeVisible({ timeout: 10000 });
  await firstItem.scrollIntoViewIfNeeded();
  
  // Hover to reveal the details button
  await firstItem.hover();
  await page.waitForTimeout(500); // Wait for hover animation (300ms + buffer)
  
  // Click the details button - use a more specific selector
  const detailsButton = firstItem.locator('[data-testid="portfolio-details-button"]');
  
  // Wait for button and click with retry
  let clicked = false;
  for (let i = 0; i < 3; i++) {
    try {
      await expect(detailsButton).toBeVisible({ timeout: 3000 });
      
      // Try different click strategies
      if (i === 0) {
        await detailsButton.click({ timeout: 2000 });
      } else if (i === 1) {
        await detailsButton.click({ force: true, timeout: 2000 });
      } else {
        // Last resort: use page.click with exact coordinates
        const box = await detailsButton.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        }
      }
      
      clicked = true;
      break;
    } catch (e) {
      console.log(`Click attempt ${i + 1} failed:`, e.message);
      if (i < 2) {
        await page.waitForTimeout(1000);
        // Re-hover in case we lost the hover state
        await firstItem.hover();
        await page.waitForTimeout(300);
      }
    }
  }
  
  if (!clicked) {
    throw new Error('Failed to click portfolio details button after 3 attempts');
  }
  
  // Wait for modal
  const modal = page.locator('[data-testid="portfolio-modal"]');
  await expect(modal).toBeVisible({ timeout: 10000 });
  
  // Wait for modal content to load
  await expect(modal.locator('h2')).toBeVisible({ timeout: 5000 });
  
  return modal;
}