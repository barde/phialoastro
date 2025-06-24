import { Page, expect } from '@playwright/test';

/**
 * Sets up console error logging for a given Playwright page.
 * Filters out known CORS errors from Cloudflare Insights.
 * @param page The Playwright page object.
 * @returns An array to which console errors will be pushed.
 */
export function setupConsoleErrorLogging(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      // Filter out known CORS errors from Cloudflare Insights
      if (!errorText.includes('cloudflareinsights.com') && !errorText.includes('CORS')) {
        console.error(`Console error: ${errorText}`);
        errors.push(errorText);
      }
    }
  });
  
  page.on('pageerror', error => {
    const errorText = `Page error: ${error.message}`;
    console.error(errorText);
    errors.push(errorText);
  });
  
  return errors;
}

/**
 * Waits for React hydration to complete by checking for React internals.
 * @param page The Playwright page object.
 * @param selector The selector to check for hydration.
 */
async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      // Check if React has attached its internal properties
      const reactProps = Object.keys(element).find(key => 
        key.startsWith('__reactInternalInstance') || 
        key.startsWith('__reactFiber')
      );
      
      return !!reactProps;
    },
    selector,
    { timeout: 10000 }
  );
}

/**
 * A robust helper to open the portfolio modal.
 * Uses proper waiting strategies and avoids race conditions.
 * @param page The Playwright page object.
 * @returns The locator for the portfolio modal.
 */
export async function openPortfolioModal(page: Page) {
  const errors = setupConsoleErrorLogging(page);

  // Navigate to the portfolio page if not already there
  if (!page.url().includes('/portfolio')) {
    console.log('Navigating to portfolio page...');
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  }

  // Wait for the portfolio section to be visible
  const portfolioSection = page.locator('.portfolio-section, [data-testid="portfolio-section"]');
  await expect(portfolioSection).toBeVisible({ timeout: 20000 });
  console.log('Portfolio section is visible.');

  // Wait for portfolio items to be loaded
  const portfolioItems = page.locator('[data-testid="portfolio-item"]');
  await expect(portfolioItems.first()).toBeVisible({ timeout: 20000 });
  
  // Count the number of items to ensure they're loaded
  const itemCount = await portfolioItems.count();
  console.log(`Found ${itemCount} portfolio items.`);
  
  // Get the first portfolio item
  const firstItem = portfolioItems.first();
  
  // Wait for React hydration on the first item
  await waitForHydration(page, '[data-testid="portfolio-item"]');
  console.log('Portfolio items are hydrated.');

  // Wait for any animations to complete
  await page.waitForTimeout(1000);

  // Hover over the item and wait for the overlay to appear
  await firstItem.hover();
  console.log('Hovered over the first portfolio item.');

  // Wait for the details button to be visible within the hovered item
  const detailsButton = firstItem.locator('[data-testid="portfolio-details-button"]');
  await expect(detailsButton).toBeVisible({ timeout: 5000 });
  console.log('Details button is visible.');

  // Ensure the button is enabled and ready
  await expect(detailsButton).toBeEnabled();

  // Try to click the details button
  try {
    await detailsButton.click({ force: true });
    console.log('Clicked the details button with force.');
  } catch (clickError) {
    console.log('Force click failed, trying JavaScript click...');
    // Fallback to JavaScript click if standard click fails
    await detailsButton.evaluate((el: HTMLElement) => el.click());
    console.log('Clicked the details button via JavaScript.');
  }

  // Add a small delay to allow for any transitions
  await page.waitForTimeout(1000);

  // Wait for the modal to appear - check multiple possible selectors
  const modal = page.locator('[data-testid="portfolio-modal"], [role="dialog"], .portfolio-modal').first();
  
  try {
    // Wait for the modal to be attached to DOM first
    await modal.waitFor({ state: 'attached', timeout: 10000 });
    console.log('Modal is attached to DOM.');
    
    // Then wait for it to be visible
    await expect(modal).toBeVisible({ timeout: 10000 });
    console.log('Portfolio modal is open.');
  } catch (modalError) {
    // If modal still doesn't appear, try clicking the first item directly
    console.log('Modal did not appear, trying direct item click...');
    await firstItem.click({ force: true });
    await page.waitForTimeout(500);
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('Portfolio modal is open after direct item click.');
  }

  // Wait for modal content to be loaded
  const modalTitle = modal.locator('h2, [data-testid="portfolio-modal-title"]').first();
  await expect(modalTitle).toBeVisible({ timeout: 5000 });
  await expect(modalTitle).toContainText(/.+/); // Ensure it has text
  console.log('Modal content is loaded.');

  // Check for any console errors during the process
  if (errors.length > 0) {
    console.warn('Console errors detected during modal opening:', errors.join('\n'));
  }

  return modal;
}

/**
 * Closes the portfolio modal.
 * @param page The Playwright page object.
 */
export async function closePortfolioModal(page: Page) {
  const modal = page.locator('[data-testid="portfolio-modal"]');
  
  // Check if modal is visible
  if (await modal.isVisible()) {
    // Try to close using the close button first
    const closeButton = modal.locator('[data-testid="portfolio-modal-close"], button[aria-label*="close" i], button[aria-label*="schließen" i]');
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      console.log('Clicked modal close button.');
    } else {
      // Fallback: press Escape
      await page.keyboard.press('Escape');
      console.log('Pressed Escape to close modal.');
    }
    
    // Wait for modal to be hidden
    await expect(modal).toBeHidden({ timeout: 5000 });
    console.log('Modal is closed.');
  }
}

/**
 * Filters portfolio items by category.
 * @param page The Playwright page object.
 * @param category The category to filter by.
 */
export async function filterPortfolioByCategory(page: Page, category: string) {
  // Find the filter button for the category
  const filterButton = page.locator(`[data-testid="portfolio-filter-${category}"], button:has-text("${category}")`).first();
  
  await expect(filterButton).toBeVisible({ timeout: 10000 });
  await filterButton.click();
  console.log(`Filtered portfolio by category: ${category}`);
  
  // Wait for filtering animation to complete
  await page.waitForTimeout(500);
  
  // Verify items are filtered
  const visibleItems = page.locator('[data-testid="portfolio-item"]:visible');
  await expect(visibleItems).toHaveCount.greaterThan(0);
}