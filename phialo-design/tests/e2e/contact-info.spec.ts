import { test, expect } from '@playwright/test';

test.describe('Contact Information Tests (Issue #7)', () => {
  test('Phone number should be displayed in footer on German pages', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    const phoneLink = footer.locator('a[href="tel:+4915785664700"]');
    
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toContainText('(+49) 1578 566 47 00');
  });

  test('Phone number should be displayed in footer on English pages', async ({ page }) => {
    await page.goto('/en/');
    
    const footer = page.locator('footer');
    const phoneLink = footer.locator('a[href="tel:+4915785664700"]');
    
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toContainText('(+49) 1578 566 47 00');
  });

  test('Phone number should be clickable in footer', async ({ page }) => {
    await page.goto('/');
    
    const phoneLink = page.locator('footer a[href="tel:+4915785664700"]');
    await expect(phoneLink).toHaveAttribute('href', 'tel:+4915785664700');
    
    // Check hover state
    await phoneLink.hover();
    // Phone link should have hover styles applied
  });

  test('Phone number should be displayed on contact page', async ({ page }) => {
    await page.goto('/contact');
    
    // Phone number appears multiple times, get the first one in the contact section
    const phoneInfo = page.locator('a[href="tel:+4915785664700"]').first();
    await expect(phoneInfo).toBeVisible();
    await expect(phoneInfo).toContainText('(+49) 1578 566 47 00');
  });

  test('Email should be displayed in footer', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    const emailLink = footer.locator('a[href="mailto:kontakt@phialo.de"]');
    
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toContainText('kontakt@phialo.de');
  });

  test('All contact methods should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    
    // Email
    const emailLink = footer.locator('a[href="mailto:kontakt@phialo.de"]');
    await expect(emailLink).toBeVisible();
    
    // Phone
    const phoneLink = footer.locator('a[href="tel:+4915785664700"]');
    await expect(phoneLink).toBeVisible();
    
    // Social media links
    const linkedinLink = footer.locator('a[href*="linkedin.com"]');
    await expect(linkedinLink).toBeVisible();
    
    const youtubeLink = footer.locator('a[href*="youtube.com"]');
    await expect(youtubeLink).toBeVisible();
    
    const instagramLink = footer.locator('a[href*="instagram.com"]');
    await expect(instagramLink).toBeVisible();
  });

  test('Contact section should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    const contactHeading = footer.locator('h3:has-text("Kontakt"), h3:has-text("Contact")');
    
    await expect(contactHeading).toBeVisible();
  });
});