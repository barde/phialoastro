import { Page, Locator } from '@playwright/test';

/**
 * Wait for React hydration to complete
 */
export async function waitForHydration(page: Page) {
  // Wait for initial load
  await page.waitForLoadState('networkidle');
  
  // Additional wait for React hydration
  await page.waitForTimeout(500);
  
  // Check if React root exists
  await page.waitForFunction(() => {
    const reactRoot = document.querySelector('[data-reactroot], #root, #app, #__next');
    return reactRoot !== null;
  }, { timeout: 5000 }).catch(() => {
    // If no React root found, that's okay - page might not use React
  });
}

/**
 * Click with retry logic for flaky elements
 */
export async function clickWithRetry(locator: Locator, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await locator.click({ timeout: 5000 });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await locator.page().waitForTimeout(1000);
    }
  }
}

/**
 * Wait for modal to be fully visible with animation
 */
export async function waitForModal(page: Page, modalSelector: string) {
  const modal = page.locator(modalSelector);
  
  // Wait for modal to be attached to DOM
  await modal.waitFor({ state: 'attached', timeout: 5000 });
  
  // Wait for animation to complete
  await page.waitForTimeout(300);
  
  // Ensure modal is visible
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  
  return modal;
}

/**
 * Get current language from URL or localStorage
 */
export async function getCurrentLanguage(page: Page): Promise<'de' | 'en'> {
  const url = page.url();
  const isEnglish = url.includes('/en/') || url.includes('/en');
  
  if (!isEnglish) {
    // Check localStorage as fallback
    const storedLang = await page.evaluate(() => 
      localStorage.getItem('preferredLanguage')
    );
    return storedLang === 'en' ? 'en' : 'de';
  }
  
  return 'en';
}

/**
 * Set language preference
 */
export async function setLanguage(page: Page, language: 'de' | 'en') {
  await page.evaluate((lang) => {
    localStorage.setItem('preferredLanguage', lang);
  }, language);
}

/**
 * Wait for page navigation with proper checks
 */
export async function waitForNavigation(page: Page, url?: string) {
  if (url) {
    await Promise.all([
      page.waitForURL(url),
      page.waitForLoadState('networkidle')
    ]);
  } else {
    await page.waitForLoadState('networkidle');
  }
  
  // Additional wait for any client-side routing
  await page.waitForTimeout(300);
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(locator: Locator): Promise<boolean> {
  return await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Scroll element into view and wait
 */
export async function scrollIntoView(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(300); // Wait for scroll animation
}

/**
 * Fill form field with validation
 */
export async function fillFormField(page: Page, selector: string, value: string) {
  const field = page.locator(selector);
  await field.waitFor({ state: 'visible' });
  await field.click();
  await field.fill(value);
  
  // Trigger validation
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, duration = 300) {
  await page.waitForTimeout(duration);
}

/**
 * Take screenshot with consistent naming
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/debug-${name}-${timestamp}.png`,
    fullPage: true 
  });
}