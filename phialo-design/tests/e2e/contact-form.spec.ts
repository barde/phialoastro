import { test, expect } from '@playwright/test';

test.describe('Contact Form Integration', () => {
  test.describe('German Contact Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact');
    });

    test('should display contact form with correct layout', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Kontakt - Gesa Pickbrenner/);
      
      // Check heading
      await expect(page.locator('h1')).toContainText('Kontakt');
      
      // Check form is on the left
      const formContainer = page.locator('form#contactForm').locator('..');
      await expect(formContainer).toBeVisible();
      
      // Check image is on the right
      const imageContainer = page.locator('img[alt="Gesa Pickbrenner"]').locator('..');
      await expect(imageContainer).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="phone"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
      
      // Check submit button
      await expect(page.locator('button[type="submit"]')).toContainText('Nachricht senden');
      
      // Check hidden fields
      await expect(page.locator('input[name="access_key"]')).toBeHidden();
      await expect(page.locator('input[name="subject"]')).toHaveValue('Neue Kontaktanfrage - Phialo Design');
      await expect(page.locator('input[name="botcheck"]')).toBeHidden();
    });

    test('should validate required fields', async ({ page }) => {
      // Try to submit empty form
      await page.locator('button[type="submit"]').click();
      
      // Check HTML5 validation messages appear
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveAttribute('required', '');
      
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('required', '');
      
      const messageInput = page.locator('textarea[name="message"]');
      await expect(messageInput).toHaveAttribute('required', '');
    });

    test('should show success message on successful submission', async ({ page }) => {
      // Mock the API response
      await page.route('https://api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '+49 123 456789');
      await page.fill('textarea[name="message"]', 'Dies ist eine Testnachricht.');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success message
      await expect(page.locator('#form-result')).toContainText('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.');
      await expect(page.locator('#form-result')).toHaveClass(/text-green-600/);
      
      // Check form is reset
      await expect(page.locator('input[name="name"]')).toHaveValue('');
      await expect(page.locator('input[name="email"]')).toHaveValue('');
      await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    });

    test('should show error message on failed submission', async ({ page }) => {
      // Mock the API error response
      await page.route('https://api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: false, 
            message: 'Invalid access key' 
          })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check error message
      await expect(page.locator('#form-result')).toContainText('Invalid access key');
      await expect(page.locator('#form-result')).toHaveClass(/text-red-600/);
    });

    test('should show loading state during submission', async ({ page }) => {
      // Mock slow API response
      await page.route('https://api.web3forms.com/submit', async route => {
        await page.waitForTimeout(1000); // Simulate delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check loading state
      await expect(page.locator('button[type="submit"]')).toContainText('Wird gesendet...');
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      
      // Wait for completion
      await expect(page.locator('button[type="submit"]')).toContainText('Nachricht senden');
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });
  });

  test.describe('English Contact Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/contact');
    });

    test('should display English contact form', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Contact - Gesa Pickbrenner/);
      
      // Check heading
      await expect(page.locator('h1')).toContainText('Contact Me');
      
      // Check form labels and placeholders
      await expect(page.locator('label[for="name"]')).toContainText('Name');
      await expect(page.locator('input[name="name"]')).toHaveAttribute('placeholder', 'Your Name');
      
      await expect(page.locator('label[for="email"]')).toContainText('Email');
      await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', 'your.email@example.com');
      
      await expect(page.locator('label[for="message"]')).toContainText('Message');
      await expect(page.locator('textarea[name="message"]')).toHaveAttribute('placeholder', 'Describe your project or inquiry...');
      
      // Check submit button
      await expect(page.locator('button[type="submit"]')).toContainText('Send Message');
      
      // Check subject line
      await expect(page.locator('input[name="subject"]')).toHaveValue('New Contact Request - Phialo Design');
    });

    test('should show English success message', async ({ page }) => {
      // Mock the API response
      await page.route('https://api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'This is a test message.');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success message
      await expect(page.locator('#form-result')).toContainText('Thank you! Your message has been sent successfully.');
      
      // Check loading state text
      await page.fill('input[name="name"]', 'Another Test');
      await page.fill('input[name="email"]', 'another@example.com');
      await page.fill('textarea[name="message"]', 'Another message');
      
      // Mock slow response
      await page.route('https://api.web3forms.com/submit', async route => {
        await page.waitForTimeout(500);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.click('button[type="submit"]');
      await expect(page.locator('button[type="submit"]')).toContainText('Sending...');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form accessibility', async ({ page }) => {
      await page.goto('/contact');
      
      // Check form has proper labels
      const nameLabel = page.locator('label[for="name"]');
      await expect(nameLabel).toBeVisible();
      await expect(nameLabel).toContainText('Name');
      
      // Check inputs have proper associations
      const nameInput = page.locator('input#name');
      await expect(nameInput).toHaveAttribute('name', 'name');
      await expect(nameInput).toHaveAttribute('required', '');
      
      // Check form can be navigated with keyboard
      await page.keyboard.press('Tab'); // Skip to first form field
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('name', 'name');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should stack form and image on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/contact');
      
      // Check that form and image are stacked (not side by side)
      const form = page.locator('form#contactForm');
      const image = page.locator('img[alt="Gesa Pickbrenner"]');
      
      await expect(form).toBeVisible();
      await expect(image).toBeVisible();
      
      // On mobile, image should be below form
      const formBox = await form.boundingBox();
      const imageBox = await image.boundingBox();
      
      expect(formBox).not.toBeNull();
      expect(imageBox).not.toBeNull();
      
      if (formBox && imageBox) {
        expect(imageBox.y).toBeGreaterThan(formBox.y);
      }
    });
  });
});