import { test } from '@playwright/test';

test('Check portfolio page images and navigation', async ({ page }) => {
  console.log('Navigating to portfolio page...');
  await page.goto('/portfolio');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if navigation is visible
  const navVisible = await page.locator('nav').first().isVisible();
  console.log('Navigation visible:', navVisible);
  
  // Check for portfolio images
  const portfolioImages = await page.locator('img[src*="/images/portfolio"]').all();
  console.log('\nPortfolio images found:', portfolioImages.length);
  
  for (const img of portfolioImages) {
    const src = await img.getAttribute('src');
    const box = await img.boundingBox();
    const isVisible = box !== null && box.width > 0 && box.height > 0;
    console.log(`- ${src?.split('/').pop()}: ${isVisible ? 'VISIBLE' : 'HIDDEN'} ${box ? `(${box.width}x${box.height})` : ''}`);
  }
  
  // Check portfolio grid
  const portfolioGrid = await page.locator('.portfolio-grid').first();
  const gridExists = (await portfolioGrid.count()) > 0;
  if (gridExists) {
    const children = await portfolioGrid.locator('> *').count();
    console.log('\nPortfolio grid children:', children);
  }
  
  // Check for opacity issues
  const hiddenElements = await page.locator('[style*="opacity: 0"], [style*="opacity:0"]').all();
  console.log('\nElements with opacity:0:', hiddenElements.length);
  
  for (const el of hiddenElements) {
    const tagName = await el.evaluate(node => node.tagName);
    const className = await el.getAttribute('class') || '';
    const text = await el.textContent() || '';
    console.log(`- ${tagName}.${className}: "${text.substring(0, 50)}..."`);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'portfolio-check.png', fullPage: true });
  console.log('\nScreenshot saved as portfolio-check.png');
  
  // Wait for hydration
  console.log('\nWaiting 5 seconds for hydration...');
  await page.waitForTimeout(5000);
  
  // Re-check after hydration
  const portfolioImagesAfter = await page.locator('img[src*="/images/portfolio"]').all();
  let visibleCount = 0;
  for (const img of portfolioImagesAfter) {
    const box = await img.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      visibleCount++;
    }
  }
  
  console.log(`\nAfter hydration: ${visibleCount} of ${portfolioImagesAfter.length} images visible`);
  
  // Take final screenshot
  await page.screenshot({ path: 'portfolio-check-after.png', fullPage: true });
  console.log('Final screenshot saved as portfolio-check-after.png');
});