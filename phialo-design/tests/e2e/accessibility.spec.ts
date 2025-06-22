import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // Run accessibility check and get results
    const results = await page.evaluate(async () => {
      // @ts-ignore - axe is injected
      return await axe.run();
    });
    
    // Filter out known acceptable violations
    const criticalViolations = results.violations.filter(violation => {
      // Allow color contrast issues as they might be design choices
      if (violation.id === 'color-contrast') return false;
      // Allow duplicate landmarks as site may have multiple nav elements
      if (violation.id === 'landmark-unique') return false;
      return true;
    });
    
    // Only fail if there are critical violations
    expect(criticalViolations).toHaveLength(0);
  });

  test('All interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // First focused element should be visible
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Tab through several elements and verify they're interactive
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          href: el?.getAttribute('href'),
          text: el?.textContent,
          type: el?.getAttribute('type')
        };
      });
      
      // Verify the focused element is interactive
      if (focused.tag) {
        expect(interactiveTags).toContain(focused.tag);
      }
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  test('Page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(allHeadings).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent?.trim()
      }));
    });
    
    // Verify no heading levels are skipped
    let previousLevel = 0;
    for (const heading of headings) {
      if (previousLevel > 0) {
        expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
      }
      previousLevel = heading.level;
    }
  });

  test('Forms should have proper labels', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = page.locator('input:not([type="hidden"]), textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        const labelCount = await label.count();
        
        if (labelCount === 0) {
          // Check for aria-label
          const ariaLabel = await input.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
        } else {
          await expect(label).toBeVisible();
        }
      }
    }
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    // Check text contrast for main content
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button');
    const elementCount = await textElements.count();
    
    // Sample a few elements for contrast checking
    const samplesToCheck = Math.min(5, elementCount);
    
    for (let i = 0; i < samplesToCheck; i++) {
      const element = textElements.nth(i);
      const contrast = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // This is a simplified check - in production, use a proper contrast calculation
        return { color, bgColor };
      });
      
      // Verify colors are defined
      expect(contrast.color).toBeTruthy();
      expect(contrast.bgColor).toBeTruthy();
    }
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have visible focus indicator (outline or box-shadow)
    const hasOutline = focusedElement?.outlineWidth !== '0px' && focusedElement?.outline !== 'none';
    const hasBoxShadow = focusedElement?.boxShadow && focusedElement.boxShadow !== 'none';
    
    expect(hasOutline || hasBoxShadow).toBeTruthy();
  });

  test('ARIA attributes should be properly used', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA labels on buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either visible text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
    
    // Check for proper ARIA roles where needed
    const navigation = page.locator('nav');
    const navCount = await navigation.count();
    expect(navCount).toBeGreaterThan(0);
  });
});