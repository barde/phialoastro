import { test } from '@playwright/test';

test('Debug portfolio rendering', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err));
  
  console.log('Navigating to portfolio...');
  await page.goto('/portfolio');
  
  // Wait for React to hydrate
  await page.waitForTimeout(3000);
  
  // Check React component state
  const portfolioSection = await page.locator('astro-island[component-url*="PortfolioSection"]').first();
  const hasPortfolioSection = (await portfolioSection.count()) > 0;
  console.log('Has portfolio section astro-island:', hasPortfolioSection);
  
  // Check if the portfolio grid has been populated
  const gridHTML = await page.locator('.portfolio-grid').innerHTML();
  console.log('Portfolio grid HTML:', gridHTML.substring(0, 200) + '...');
  
  // Check React hydration
  const reactRoot = await page.evaluate(() => {
    const islands = document.querySelectorAll('astro-island');
    return Array.from(islands).map(island => ({
      url: island.getAttribute('component-url'),
      hydrated: island.hasAttribute('ssr') && island.children.length > 0
    }));
  });
  console.log('React islands:', reactRoot);
  
  // Check for any error messages
  const errors = await page.locator('.error, [data-error]').all();
  if (errors.length > 0) {
    console.log('Found errors on page');
  }
  
  // Force click on portfolio section to trigger any lazy loading
  const portfolioContainer = await page.locator('#portfolio').first();
  if ((await portfolioContainer.count()) > 0) {
    await portfolioContainer.scrollIntoViewIfNeeded();
    console.log('Scrolled to portfolio section');
  }
  
  // Wait and check again
  await page.waitForTimeout(2000);
  
  // Final check
  const finalImages = await page.locator('img[src*="/images/portfolio"]').count();
  console.log('Final portfolio image count:', finalImages);
  
  // Get all image sources
  const imageSrcs = await page.locator('img').evaluateAll(imgs => 
    imgs.map(img => {
      const imgElement = img as HTMLImageElement;
      return {
        src: imgElement.src,
        alt: imgElement.alt,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight,
        complete: imgElement.complete
      };
    })
  );
  console.log('All images on page:', imageSrcs);
});