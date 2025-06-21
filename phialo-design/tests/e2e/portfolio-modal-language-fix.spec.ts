import { test, expect } from '@playwright/test';

test.describe('Portfolio Modal Language Fix (Issue #22)', () => {
  test('Should display modal text in English on English portfolio pages', async ({ page }) => {
    // Navigate to English portfolio page
    await page.goto('/en/portfolio');
    
    // Wait for portfolio items to load and hydrate
    await page.waitForSelector('.portfolio-item');
    await page.waitForTimeout(1000); // Allow React hydration to complete
    
    // Click any visible button to open modal
    const firstItem = page.locator('.portfolio-item').first();
    const detailsButton = firstItem.locator('button').first();
    await detailsButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(500); // Give modal time to open
    
    // Check category badge is in English - find it within the modal
    const modalContent = page.locator('[role="dialog"]');
    await expect(modalContent).toBeVisible();
    const categoryBadge = modalContent.locator('span.uppercase.tracking-wider').first();
    const categoryText = await categoryBadge.textContent();
    
    // Category should be translated (e.g., "Earrings" not "Ohrringe")
    expect(categoryText?.toLowerCase()).toMatch(/rings|earrings|pendants|sculptures|pins|jewelry/i);
    expect(categoryText?.toLowerCase()).not.toMatch(/ringe|ohrringe|anhänger|skulpturen|anstecker|schmuck/i);
    
    // Check all field labels are in English
    await expect(modalContent.locator('h3:has-text("Materials")')).toBeVisible();
    
    // Check if client field exists and is in English
    const clientLabel = page.locator('h4:has-text("Client")');
    if (await clientLabel.count() > 0) {
      await expect(clientLabel).toBeVisible();
    }
    
    // Check if project date field exists and is in English
    const projectDateLabel = page.locator('h4:has-text("Project Date")');
    if (await projectDateLabel.count() > 0) {
      await expect(projectDateLabel).toBeVisible();
    }
    
    // Check availability field if it exists
    const availabilityLabel = page.locator('h4:has-text("Availability")');
    if (await availabilityLabel.count() > 0) {
      await expect(availabilityLabel).toBeVisible();
      
      // Check availability value is translated
      const availabilityValue = availabilityLabel.locator('~ p');
      const availText = await availabilityValue.textContent();
      expect(availText).toMatch(/Available|Custom Order|Sold|Exhibition Only/i);
    }
    
    // Check navigation aria-labels
    const prevButton = page.locator('button[aria-label="Previous image"]');
    const nextButton = page.locator('button[aria-label="Next image"]');
    const closeButton = page.locator('button[aria-label="Close modal"]');
    
    if (await prevButton.count() > 0) {
      await expect(prevButton).toHaveAttribute('aria-label', 'Previous image');
    }
    if (await nextButton.count() > 0) {
      await expect(nextButton).toHaveAttribute('aria-label', 'Next image');
    }
    await expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
  });

  test('Should display modal text in German on German portfolio pages', async ({ page }) => {
    // Navigate to German portfolio page
    await page.goto('/portfolio');
    
    // Wait for portfolio items to load and hydrate
    await page.waitForSelector('.portfolio-item');
    await page.waitForTimeout(1000); // Allow React hydration to complete
    
    // Click any visible button to open modal
    const firstItem = page.locator('.portfolio-item').first();
    const detailsButton = firstItem.locator('button').first();
    await detailsButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(500); // Give modal time to open
    
    // Check category badge remains in German - find it within the modal
    const modalContent = page.locator('[role="dialog"]');
    await expect(modalContent).toBeVisible();
    const categoryBadge = modalContent.locator('span.uppercase.tracking-wider').first();
    const categoryText = await categoryBadge.textContent();
    
    // Category should be in German
    expect(categoryText?.toLowerCase()).toMatch(/ringe|ohrringe|anhänger|skulpturen|anstecker|schmuck/i);
    
    // Check all field labels are in German
    await expect(modalContent.locator('h3:has-text("Materialien")')).toBeVisible();
    
    // Check navigation aria-labels
    const prevButton = page.locator('button[aria-label="Vorheriges Bild"]');
    const nextButton = page.locator('button[aria-label="Nächstes Bild"]');
    const closeButton = page.locator('button[aria-label="Modal schließen"]');
    
    if (await prevButton.count() > 0) {
      await expect(prevButton).toHaveAttribute('aria-label', 'Vorheriges Bild');
    }
    if (await nextButton.count() > 0) {
      await expect(nextButton).toHaveAttribute('aria-label', 'Nächstes Bild');
    }
    await expect(closeButton).toHaveAttribute('aria-label', 'Modal schließen');
  });

  test('Should maintain language when navigating between portfolio items', async ({ page }) => {
    // Navigate to English portfolio page
    await page.goto('/en/portfolio');
    
    // Wait for portfolio items to load and hydrate
    await page.waitForSelector('.portfolio-item');
    await page.waitForTimeout(1000); // Allow React hydration to complete
    
    // Open first item
    const firstItem = page.locator('.portfolio-item').first();
    const firstDetailsButton = firstItem.locator('button').first();
    await firstDetailsButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Check it's in English
    const modalContent2 = page.locator('[role="dialog"]');
    await expect(modalContent2.locator('h3:has-text("Materials")')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Open second item
    const secondItem = page.locator('.portfolio-item').nth(1);
    const secondDetailsButton = secondItem.locator('button').first();
    await secondDetailsButton.click();
    
    // Wait for modal
    await page.waitForTimeout(500);
    
    // Modal should still show English text
    const modalContent3 = page.locator('[role="dialog"]');
    await expect(modalContent3.locator('h3:has-text("Materials")')).toBeVisible();
  });
});