import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Opening About page...');
  await page.goto('http://localhost:4322/about');
  
  // Wait for content to be visible
  await page.waitForSelector('h1:has-text("Über mich")', { timeout: 5000 });
  
  // Check if text is visible
  const textVisible = await page.isVisible('text=Hallo! Ich bin Gesa Pickbrenner.');
  console.log('Text visible:', textVisible);
  
  // Take a screenshot
  await page.screenshot({ path: 'about-page-screenshot.png', fullPage: true });
  console.log('Screenshot saved as about-page-screenshot.png');
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open for inspection. Close it manually when done.');
  
  // Wait for user to close browser
  await page.waitForTimeout(60000);
  await browser.close();
})();