import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests (Issue #4)', () => {
  test('Hero section should not have floating elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that there are no floating logo elements
    const floatingLogo = page.locator('.hero-jewelry, .floating-logo, [class*="float"]');
    const floatingLogoCount = await floatingLogo.count();
    
    // If floating elements exist, they should be static (no hover animations)
    if (floatingLogoCount > 0) {
      for (let i = 0; i < floatingLogoCount; i++) {
        const element = floatingLogo.nth(i);
        const classes = await element.getAttribute('class');
        expect(classes).not.toContain('hover:');
        expect(classes).not.toContain('animate-float');
      }
    }
  });

  test('Mouse/scroll indicator should not be present', async ({ page }) => {
    await page.goto('/');
    
    // Check for absence of mouse scroll indicators
    const mouseIndicators = page.locator('[class*="mouse"], [class*="scroll-indicator"], .animate-bounce:has(div)');
    const indicatorCount = await mouseIndicators.count();
    
    // Scroll indicators should not exist
    expect(indicatorCount).toBe(0);
  });

  test('@critical Hero section should have clean, minimal design', async ({ page }) => {
    await page.goto('/');
    
    const heroSection = page.locator('.hero, section').first();
    await expect(heroSection).toBeVisible();
    
    // Main heading should be visible
    const heading = heroSection.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/3D Design|Schmuck|Tutorials/);
    
    // CTA button should be visible
    const ctaButton = heroSection.locator('a:has-text("Portfolio"), a:has-text("Explore Portfolio")');
    await expect(ctaButton).toBeVisible();
  });

  test('Background should be subtle without distracting animations', async ({ page }) => {
    await page.goto('/');
    
    const hero = page.locator('.hero, section').first();
    const backgroundElements = hero.locator('.hero-bg');
    
    if (await backgroundElements.count() > 0) {
      // Background should have subtle styling
      const bgElement = backgroundElements.first();
      await expect(bgElement).toBeVisible();
      
      // Check for subtle opacity
      const jewelryElement = await bgElement.locator('.hero-jewelry, img').first();
      if (await jewelryElement.count() > 0) {
        const opacity = await jewelryElement.evaluate(el => 
          window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeLessThanOrEqual(0.3);
      }
    }
  });

  test('Page should load without animation glitches', async ({ page }) => {
    await page.goto('/');
    
    // Wait for animations to settle
    await page.waitForTimeout(1000);
    
    // Check that all main elements are visible
    await expect(page.locator('header#main-header')).toBeVisible();
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // No elements should be off-screen or have broken animations
    const offScreenElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const offScreen: Array<{tag: string, class: string, rect: DOMRect}> = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // Check if element is supposed to be visible but is off-screen
        if (style.opacity !== '0' && style.visibility !== 'hidden' && style.display !== 'none') {
          if (rect.bottom < 0 || rect.top > window.innerHeight || 
              rect.right < 0 || rect.left > window.innerWidth) {
            if (rect.width > 0 && rect.height > 0) {
              offScreen.push({
                tag: el.tagName,
                class: el.className,
                rect: rect
              });
            }
          }
        }
      });
      
      return offScreen;
    });
    
    expect(offScreenElements.length).toBe(0);
  });
});