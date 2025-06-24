import { Page, expect } from '@playwright/test';

/**
 * Portfolio helper using Playwright's locator API with proper waits
 */

// Capture console errors
export function setupConsoleErrorLogging(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = `Console error: ${msg.text()}`;
      console.error(errorText);
      errors.push(errorText);
    }
  });
  
  page.on('pageerror', error => {
    const errorText = `Page error: ${error.message}`;
    console.error(errorText);
    errors.push(errorText);
  });
  
  return errors;
}

export async function openPortfolioModal(page: Page) {
  const errors = setupConsoleErrorLogging(page);
  
  // Navigate to portfolio if not already there
  if (!page.url().includes('/portfolio')) {
    await page.goto('/portfolio');
  }
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Use locator API with built-in waiting
  const portfolioSection = page.locator('.portfolio-section');
  await portfolioSection.waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait for hydration marker or timeout
  const hydratedItem = page.locator('[data-testid="portfolio-item"][data-hydrated="true"]').first();
  try {
    await hydratedItem.waitFor({ state: 'attached', timeout: 5000 });
    console.log('Found hydrated portfolio item');
  } catch {
    console.log('No hydration marker, waiting for stability');
    await page.waitForTimeout(2000);
  }
  
  // Get first portfolio item using locator
  const firstItem = page.locator('[data-testid="portfolio-item"]').first();
  await firstItem.waitFor({ state: 'visible' });
  
  // Scroll into view and hover
  await firstItem.scrollIntoViewIfNeeded();
  await firstItem.hover();
  
  // Wait for hover effect (CSS transition)
  await page.waitForTimeout(500);
  
  // Get details button using locator chaining
  const detailsButton = firstItem.locator('[data-testid="portfolio-details-button"]');
  
  // Wait for button to be visible and enabled
  await detailsButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Try to click with built-in retry
  let clicked = false;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`Click attempt ${attempt + 1}`);
      
      // Check if button is actually visible
      const isVisible = await detailsButton.isVisible();
      if (!isVisible) {
        throw new Error('Button not visible');
      }
      
      // Try clicking
      await detailsButton.click({ timeout: 3000 });
      clicked = true;
      console.log('Click successful');
      break;
      
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);
      
      if (attempt < 2) {
        // Re-hover before retry
        await firstItem.hover();
        await page.waitForTimeout(300);
      }
    }
  }
  
  if (!clicked) {
    console.log('Regular click failed, trying JavaScript evaluation');
    
    // Try JavaScript click as fallback
    const jsClickResult = await page.evaluate(() => {
      const firstItem = document.querySelector('[data-testid="portfolio-item"]');
      if (!firstItem) return { success: false, error: 'No portfolio item found' };
      
      // Dispatch mouseover event first
      firstItem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      
      // Wait a bit for hover effect
      return new Promise(resolve => {
        setTimeout(() => {
          const button = firstItem.querySelector('[data-testid="portfolio-details-button"]');
          if (!button) {
            resolve({ success: false, error: 'No details button found after hover' });
            return;
          }
          
          // Try clicking
          (button as HTMLElement).click();
          
          // Also dispatch click event
          button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          
          resolve({ success: true });
        }, 300);
      });
    });
    
    if (!jsClickResult.success) {
      if (errors.length > 0) {
        console.error('Console errors:', errors.join('\n'));
      }
      throw new Error(`Failed to click via JS: ${jsClickResult.error}. Console errors: ${errors.length}`);
    }
    
    console.log('JavaScript click successful');
  }
  
  // Before waiting for modal, check if portfolio items have onClick handlers
  const hasHandlers = await page.evaluate(() => {
    const items = document.querySelectorAll('[data-testid="portfolio-item"]');
    return Array.from(items).map((item, index) => {
      const button = item.querySelector('[data-testid="portfolio-details-button"]');
      return {
        index,
        hasButton: !!button,
        hasOnClick: button ? !!(button as any).onclick : false,
        hasReactHandlers: button ? !!Object.keys(button).find(key => key.startsWith('__react')) : false
      };
    });
  });
  console.log('Portfolio items onClick status:', JSON.stringify(hasHandlers.slice(0, 3)));
  
  // Wait for modal using locator
  const modal = page.locator('[data-testid="portfolio-modal"]');
  
  try {
    // First wait for modal to be attached to DOM
    await modal.waitFor({ state: 'attached', timeout: 5000 });
    // Then wait for it to be visible
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Modal is visible');
  } catch (error) {
    // Enhanced debugging
    const modalCount = await page.locator('[data-testid="portfolio-modal"]').count();
    const modalHidden = await page.locator('[data-testid="portfolio-modal"][style*="display: none"]').count();
    const bodyClasses = await page.locator('body').getAttribute('class');
    
    console.error(`Modal debug info:
    - Modal elements in DOM: ${modalCount}
    - Hidden modals: ${modalHidden}
    - Body classes: ${bodyClasses}
    - Console errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.error('Errors:', errors.join('\n'));
    }
    
    throw error;
  }
  
  // Wait for modal content
  const modalTitle = modal.locator('h2').first();
  await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
  
  return modal;
}

// Alternative approach using JavaScript evaluation
export async function openPortfolioModalWithJS(page: Page) {
  const errors = setupConsoleErrorLogging(page);
  
  // Navigate to portfolio if not already there
  if (!page.url().includes('/portfolio')) {
    await page.goto('/portfolio');
  }
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Allow hydration
  
  // Click using JavaScript
  const clicked = await page.evaluate(() => {
    const firstItem = document.querySelector('[data-testid="portfolio-item"]');
    if (!firstItem) return { success: false, error: 'No portfolio item found' };
    
    const button = firstItem.querySelector('[data-testid="portfolio-details-button"]');
    if (!button) return { success: false, error: 'No details button found' };
    
    // Trigger click
    (button as HTMLElement).click();
    return { success: true };
  });
  
  if (!clicked.success) {
    throw new Error(`Failed to click via JS: ${clicked.error}`);
  }
  
  // Wait for modal
  const modal = page.locator('[data-testid="portfolio-modal"]');
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  
  return modal;
}