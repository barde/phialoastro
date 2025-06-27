import { test, expect } from '@playwright/test';

test.describe('Classes Section Translation Tests', () => {
  test.describe('German Language', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('preferred-language', 'de');
      });
      await page.reload();
    });

    test('should display German text for all classes in German mode', async ({ page }) => {
      await page.goto('/#classes');
      
      // Check section title and subtitle
      await expect(page.locator('#classes h2')).toHaveText('Classs');
      await expect(page.locator('#classes p').first()).toContainText('Lernen Sie 3D-Design mit Blender');
      
      // Check all tutorial cards
      const classCards = page.locator('.class-card');
      const count = await classCards.count();
      
      for (let i = 0; i < count; i++) {
        const card = classCards.nth(i);
        const title = await card.locator('h3').textContent();
        const description = await card.locator('p').textContent();
        const category = await card.locator('.text-xs').textContent();
        
        // Log each tutorial for debugging
        console.log(`Class ${i + 1}:`);
        console.log(`  Title: ${title}`);
        console.log(`  Description: ${description}`);
        console.log(`  Category: ${category}`);
        
        // Check that English classes should not be shown in German mode
        // Currently failing because classes are hardcoded
        if (i === 0) {
          // First tutorial is in German
          expect(title).toContain('Lern Blender');
          expect(description).toContain('Lernen Sie Blender');
          expect(category).toContain('Deutsch');
        } else {
          // Other classes should also be in German but are currently in English
          // This test will fail, documenting the issue
          expect(title).not.toMatch(/^[A-Za-z\s\-]+$/); // Should not be pure English
        }
      }
      
      // Check button labels
      const skillshareLinks = page.locator('a:has-text("Auf Skillshare ansehen")');
      await expect(skillshareLinks.first()).toBeVisible();
      
      const directPurchaseLinks = page.locator('a:has-text("Direkt kaufen")');
      if (await directPurchaseLinks.count() > 0) {
        await expect(directPurchaseLinks.first()).toBeVisible();
      }
    });

    test('should navigate to German tutorial listing page', async ({ page }) => {
      await page.goto('/classes/');
      
      // Check page title and content
      await expect(page.locator('h1')).toContainText('Classs');
      await expect(page.locator('main')).toContainText('3D-Design');
    });
  });

  test.describe('English Language', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('preferred-language', 'en');
      });
      await page.reload();
    });

    test('should display English text for all classes in English mode', async ({ page }) => {
      await page.goto('/en/#classes');
      
      // Check section title and subtitle
      await expect(page.locator('#classes h2')).toHaveText('Classs');
      await expect(page.locator('#classes p').first()).toContainText('Learn 3D design with Blender');
      
      // Check all tutorial cards
      const classCards = page.locator('.class-card');
      const count = await classCards.count();
      
      for (let i = 0; i < count; i++) {
        const card = classCards.nth(i);
        const title = await card.locator('h3').textContent();
        const description = await card.locator('p').textContent();
        const category = await card.locator('.text-xs').textContent();
        
        // Log each tutorial for debugging
        console.log(`Class ${i + 1}:`);
        console.log(`  Title: ${title}`);
        console.log(`  Description: ${description}`);
        console.log(`  Category: ${category}`);
        
        // Check that German classes should not be shown in English mode
        // Currently failing because classes are hardcoded
        if (i === 0) {
          // First tutorial should be in English but is in German
          // This test will fail, documenting the issue
          expect(title).not.toContain('Lern Blender');
          expect(description).not.toContain('Lernen Sie');
          expect(category).toContain('English');
        } else {
          // Other classes are correctly in English
          expect(category).toContain('English');
        }
      }
      
      // Check button labels
      const skillshareLinks = page.locator('a:has-text("View on Skillshare")');
      await expect(skillshareLinks.first()).toBeVisible();
      
      const directPurchaseLinks = page.locator('a:has-text("Direct purchase")');
      if (await directPurchaseLinks.count() > 0) {
        await expect(directPurchaseLinks.first()).toBeVisible();
      }
    });

    test('should navigate to English tutorial listing page', async ({ page }) => {
      await page.goto('/en/classes/');
      
      // Check page title and content
      await expect(page.locator('h1')).toContainText('Classs');
      await expect(page.locator('main')).toContainText('3D design');
    });
  });

  test.describe('Language Switching', () => {
    test('should update tutorial content when switching languages', async ({ page }) => {
      await page.goto('/#classes');
      
      // Start in German
      await page.evaluate(() => {
        localStorage.setItem('preferred-language', 'de');
      });
      await page.reload();
      
      // Check German content
      await expect(page.locator('#classes p').first()).toContainText('Lernen Sie 3D-Design');
      
      // Switch to English using language selector
      await page.getByLabel('Change language').click();
      await page.getByRole('button', { name: 'English' }).click();
      
      // Wait for navigation
      await page.waitForURL('/en/**');
      
      // Check English content
      await expect(page.locator('#classes p').first()).toContainText('Learn 3D design');
      
      // Verify tutorial cards updated (currently failing)
      // This documents that tutorial cards don't update with language switch
      const firstClassTitle = await page.locator('.class-card h3').first().textContent();
      expect(firstClassTitle).not.toContain('Lern Blender'); // Should be English
    });
  });

  test.describe('Content Collection Integration', () => {
    test('should load classes from content collection', async ({ page }) => {
      // This test checks if the content collection is properly used
      // Currently failing because classes are hardcoded
      
      await page.goto('/classes/');
      
      // Check if individual tutorial pages exist
      const tutorialLinks = [
        '/classes/blender-beginner-course',
        '/classes/from-sketch-to-model',
        '/classes/blender-ring-design',
        '/classes/unique-surface-patterns'
      ];
      
      for (const link of tutorialLinks) {
        const response = await page.goto(link);
        expect(response?.status()).toBeLessThan(400);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels in both languages', async ({ page }) => {
      // German
      await page.goto('/#classes');
      const germanIndicators = page.locator('[aria-label^="Go to tutorial"]');
      await expect(germanIndicators.first()).toHaveAttribute('aria-label', 'Go to tutorial 1');
      
      // English
      await page.goto('/en/#classes');
      const englishIndicators = page.locator('[aria-label^="Go to tutorial"]');
      await expect(englishIndicators.first()).toHaveAttribute('aria-label', 'Go to tutorial 1');
    });
  });
});

test.describe('Visual Regression Tests', () => {
  test('tutorial section should look consistent in both languages', async ({ page }) => {
    // German version
    await page.goto('/#classes');
    await page.waitForSelector('.class-card');
    await expect(page.locator('#classes')).toHaveScreenshot('classes-section-de.png');
    
    // English version
    await page.goto('/en/#classes');
    await page.waitForSelector('.class-card');
    await expect(page.locator('#classes')).toHaveScreenshot('classes-section-en.png');
  });
});