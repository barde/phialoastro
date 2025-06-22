import { Page, expect } from '@playwright/test';

/**
 * Wait for portfolio items to be fully loaded
 */
export async function waitForPortfolioLoad(page: Page) {
  // Wait for portfolio grid to be visible
  await page.waitForSelector('[data-testid="portfolio-grid"]', { 
    state: 'visible',
    timeout: 10000 
  });
  
  // Wait for portfolio items to load
  await page.waitForFunction(() => {
    const items = document.querySelectorAll('[data-testid="portfolio-item"]');
    return items.length > 0;
  }, { timeout: 10000 });
  
  // Wait for images to load
  await page.waitForLoadState('networkidle');
}

/**
 * Click portfolio item with retry logic
 */
export async function clickPortfolioItem(page: Page, index: number = 0) {
  // First wait for portfolio items to be loaded
  await waitForPortfolioLoad(page);
  
  // Get portfolio items
  const items = page.locator('[data-testid="portfolio-item"]');
  const count = await items.count();
  
  if (count === 0) {
    throw new Error('No portfolio items found');
  }
  
  if (index >= count) {
    throw new Error(`Portfolio item index ${index} out of range (found ${count} items)`);
  }
  
  // Hover over the item to reveal the overlay with the Details button
  const targetItem = items.nth(index);
  await targetItem.hover();
  
  // Wait for the overlay to appear
  await page.waitForTimeout(300); // Animation time
  
  // Click the Details button using the test ID
  const detailsButton = targetItem.locator('[data-testid="portfolio-details-button"]');
  
  // Retry logic for clicking
  let retries = 3;
  while (retries > 0) {
    try {
      // Ensure we're still hovering
      await targetItem.hover();
      await page.waitForTimeout(100);
      
      // Click the details button
      await detailsButton.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[data-testid="portfolio-modal"]', {
        state: 'visible',
        timeout: 5000
      });
      
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log(`Retry ${3 - retries}/3 for clicking portfolio item ${index}`);
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Close portfolio modal with retry logic
 */
export async function closePortfolioModal(page: Page) {
  // Use the test ID for the close button
  const closeButton = page.locator('[data-testid="modal-close"]');
  
  // Click the close button
  await closeButton.click();
  
  // Wait for modal to disappear
  await page.waitForSelector('[data-testid="portfolio-modal"]', {
    state: 'hidden',
    timeout: 5000
  });
}

/**
 * Get language from URL
 */
export function getLanguageFromUrl(url: string): 'de' | 'en' {
  return url.includes('/en/') || url.includes('/en?') || url.endsWith('/en') ? 'en' : 'de';
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * Wait for hydration to complete
 */
export async function waitForHydration(page: Page) {
  // Wait for React hydration
  await page.waitForFunction(() => {
    // Check if React is loaded
    if (typeof (window as any).React === 'undefined') return true; // No React, no hydration needed
    
    // Check for hydration markers
    const root = document.querySelector('#root, [data-reactroot], main');
    if (!root) return true;
    
    // Check if there are any pending hydration markers
    const pendingHydration = document.querySelector('[data-react-hydrate]');
    return !pendingHydration;
  }, { timeout: 5000 });
  
  // Additional wait for any animations
  await page.waitForTimeout(500);
}

/**
 * Set up test with proper error handling
 */
export async function setupTest(page: Page) {
  // Set up console error tracking
  const errors = await checkForConsoleErrors(page);
  
  // Set up request failure tracking
  page.on('requestfailed', request => {
    console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Wait for initial page load
  await page.waitForLoadState('domcontentloaded');
  
  return { errors };
}

/**
 * Get portfolio item details with better error handling
 */
export async function getPortfolioItemDetails(page: Page, index: number) {
  await waitForPortfolioLoad(page);
  
  const items = page.locator('[data-testid="portfolio-item"]');
  const item = items.nth(index);
  
  await expect(item).toBeVisible();
  
  // Get title with multiple possible selectors
  const titleSelectors = ['h3', 'h4', '.title', '[data-testid="item-title"]'];
  let title = '';
  
  for (const selector of titleSelectors) {
    const titleElement = item.locator(selector).first();
    if (await titleElement.isVisible()) {
      title = await titleElement.textContent() || '';
      break;
    }
  }
  
  return { title: title.trim() };
}