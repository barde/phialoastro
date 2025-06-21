import { test, expect } from '@playwright/test';

// German words that should NOT appear on English pages
const GERMAN_WORDS = [
  'verbinden',
  'einzigartigen',
  'Diese',
  'wissenschaftliche',
  'Ästhetik',
  'kunstvoller',
  'Handwerkskunst',
  'außergewöhnlicher',
  'Materialien',
  'Techniken',
  'wurde',
  'durch',
  'präzise'
];

// English words that should appear on English pages
const ENGLISH_WORDS = [
  'combine',
  'unique',
  'These',
  'scientific',
  'aesthetics',
  'artistic',
  'craftsmanship',
  'extraordinary',
  'Materials',
  'Techniques',
  'was',
  'through',
  'precise'
];

test.describe('Comprehensive Portfolio Translation Tests', () => {
  test('Should NOT show any German words in English portfolio modals', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    // Get all portfolio items
    const portfolioItems = await page.locator('.portfolio-item').all();
    console.log(`Found ${portfolioItems.length} portfolio items`);
    
    // Test first 3 items to ensure variety
    const itemsToTest = Math.min(3, portfolioItems.length);
    
    for (let i = 0; i < itemsToTest; i++) {
      console.log(`\nTesting portfolio item ${i + 1}`);
      
      // Click on portfolio item
      await portfolioItems[i].click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Get all text content from the modal
      const modalContent = await page.locator('[role="dialog"]').textContent();
      
      // Check for German words
      const foundGermanWords = GERMAN_WORDS.filter(word => 
        modalContent?.toLowerCase().includes(word.toLowerCase())
      );
      
      if (foundGermanWords.length > 0) {
        console.error(`Found German words in item ${i + 1}:`, foundGermanWords);
      }
      
      // Assert no German words are found
      expect(foundGermanWords).toHaveLength(0);
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });

  test('Should show English translations for all content types', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    // Click first item (DNA Spiral Earrings)
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check specific content areas
    const description = await page.locator('[role="dialog"] .prose p').first().textContent();
    const materialsHeader = await page.locator('[role="dialog"] h4').filter({ hasText: /Materials/i }).textContent();
    const techniquesHeader = await page.locator('[role="dialog"] h4').filter({ hasText: /Techniques/i }).textContent();
    
    // Verify English content
    expect(description).toContain('combine scientific aesthetics');
    expect(description).not.toContain('verbinden wissenschaftliche Ästhetik');
    expect(materialsHeader).toBe('Materials');
    expect(techniquesHeader).toBe('Techniques');
    
    // Check materials list
    const materials = await page.locator('[role="dialog"] ul').first().textContent();
    expect(materials).toContain('925 Silver');
    expect(materials).not.toContain('925er Silber');
  });

  test('Should maintain correct language across multiple modal opens', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    const itemsToTest = 3;
    const germanWordsFound: string[] = [];
    
    for (let i = 0; i < itemsToTest; i++) {
      // Click on portfolio item
      await page.locator('.portfolio-item').nth(i).click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Get modal content
      const modalContent = await page.locator('[role="dialog"]').textContent();
      
      // Check for specific German word "verbinden"
      if (modalContent?.includes('verbinden')) {
        germanWordsFound.push(`Item ${i + 1} contains "verbinden"`);
      }
      
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    expect(germanWordsFound).toHaveLength(0);
  });

  test('German pages should show German content', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    // Click first item
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Get content
    const description = await page.locator('[role="dialog"] .prose p').first().textContent();
    const materialsHeader = await page.locator('[role="dialog"] h4').filter({ hasText: /Materialien/i }).textContent();
    
    // Verify German content
    expect(description).toContain('verbinden wissenschaftliche Ästhetik');
    expect(materialsHeader).toBe('Materialien');
  });

  test('Navigation between language versions should update all content', async ({ page }) => {
    // Start on German page
    await page.goto('/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    // Open modal
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Get German content
    const germanDesc = await page.locator('[role="dialog"] .prose p').first().textContent();
    expect(germanDesc).toContain('verbinden');
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Navigate to English version
    await page.goto('/en/portfolio');
    await page.waitForSelector('.portfolio-item', { timeout: 10000 });
    
    // Open same modal
    await page.locator('.portfolio-item').first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Get English content
    const englishDesc = await page.locator('[role="dialog"] .prose p').first().textContent();
    expect(englishDesc).not.toContain('verbinden');
    expect(englishDesc).toContain('combine');
  });
});