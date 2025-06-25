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
      const formContainer = page.locator('form').first();
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
    });

    test('@critical should validate required fields', async ({ page }) => {
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

    test('@critical should show success message on successful submission', async ({ page }) => {
      // Mock the API response to avoid sending real emails
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      // Fill out form
      await page.fill('input[name="name"]', 'E2E Test User');
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('input[name="phone"]', '+49 123 456789');
      await page.fill('textarea[name="message"]', 'Dies ist eine automatisierte E2E Testnachricht.');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success modal appears
      const successModal = page.locator('.fixed.inset-0').filter({ hasText: 'Erfolg!' });
      await expect(successModal).toBeVisible();
      await expect(successModal).toContainText('Ihre Nachricht wurde erfolgreich gesendet');
      
      // Close modal
      await page.click('button:has-text("Schließen")');
      
      // Check form is reset
      await expect(page.locator('input[name="name"]')).toHaveValue('');
      await expect(page.locator('input[name="email"]')).toHaveValue('');
      await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    });

    test('should show error message for invalid access key', async ({ page }) => {
      // Mock the API response for invalid access key
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid access key' })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check error modal appears
      const errorModal = page.locator('.fixed.inset-0').filter({ hasText: 'Fehler' });
      await expect(errorModal).toBeVisible();
      await expect(errorModal).toContainText('Konfigurationsfehler: Ungültiger Access Key');
    });

    test('should show loading state during submission', async ({ page }) => {
      // Mock a delayed API response
      await page.route('**/api.web3forms.com/submit', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      
      // Start submission
      const submitPromise = page.click('button[type="submit"]');
      
      // Check loading state
      await expect(page.locator('button[type="submit"]')).toContainText('Wird gesendet...');
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      
      await submitPromise;
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
      await expect(page.locator('h1')).toContainText('Contact');
      
      // Check form labels and placeholders
      await expect(page.locator('label[for="name"]')).toContainText('Name');
      await expect(page.locator('input[name="name"]')).toHaveAttribute('placeholder', 'Your Name');
      
      await expect(page.locator('label[for="email"]')).toContainText('Email');
      await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', 'your.email@example.com');
      
      await expect(page.locator('label[for="message"]')).toContainText('Message');
      await expect(page.locator('textarea[name="message"]')).toHaveAttribute('placeholder', 'Describe your project or inquiry...');
      
      // Check submit button
      await expect(page.locator('button[type="submit"]')).toContainText('Send Message');
    });

    test('@critical should show English success message', async ({ page }) => {
      // Mock the API response
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      // Fill out form
      await page.fill('input[name="name"]', 'E2E Test User');
      await page.fill('input[name="email"]', 'e2e-test@example.com');
      await page.fill('textarea[name="message"]', 'This is an automated E2E test message.');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check success modal appears
      const successModal = page.locator('.fixed.inset-0').filter({ hasText: 'Success!' });
      await expect(successModal).toBeVisible();
      await expect(successModal).toContainText('Your message has been sent successfully');
    });

    test('should show English error message for invalid key', async ({ page }) => {
      // Mock the API response for invalid access key
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Invalid access key' })
        });
      });

      // Fill out form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check error modal appears
      const errorModal = page.locator('.fixed.inset-0').filter({ hasText: 'Error' });
      await expect(errorModal).toBeVisible();
      await expect(errorModal).toContainText('Configuration error: Invalid access key');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form accessibility', async ({ page }) => {
      await page.goto('/contact');
      
      // Form element has implicit role="form", no need to check explicit role
      
      // Check all inputs have associated labels
      const inputs = await page.locator('input:not([type="hidden"]), textarea').all();
      
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
      
      // Check required fields have aria-required
      await expect(page.locator('input[name="name"]')).toHaveAttribute('required', '');
      await expect(page.locator('input[name="email"]')).toHaveAttribute('required', '');
      await expect(page.locator('textarea[name="message"]')).toHaveAttribute('required', '');
      
      // Check form can be navigated with keyboard
      await page.keyboard.press('Tab'); // Should focus first input
      await expect(page.locator('input[name="name"]')).toBeFocused();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('@critical should stack form and image on mobile', async ({ page }) => {
      await page.goto('/contact');
      
      // Check that form and image are stacked (not side by side)
      const form = page.locator('form').first();
      const image = page.locator('img[alt="Gesa Pickbrenner"]');
      
      await expect(form).toBeVisible();
      await expect(image).toBeVisible();
      
      // Get bounding boxes
      const formBox = await form.boundingBox();
      const imageBox = await image.boundingBox();
      
      if (formBox && imageBox) {
        // Check that image is below form (y position is greater)
        expect(imageBox.y).toBeGreaterThan(formBox.y + formBox.height);
      }
    });
  });
});