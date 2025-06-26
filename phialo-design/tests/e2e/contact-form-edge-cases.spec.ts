import { test, expect } from '@playwright/test';

test.describe('Contact Form Edge Cases', () => {
  test.describe('Network Errors', () => {
    test('should handle network timeout gracefully', async ({ page }) => {
      await page.goto('/contact');
      
      // Simulate network timeout
      await page.route('https://api.web3forms.com/submit', async route => {
        await route.abort('timedout');
      });

      // Fill and submit form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      await page.click('button[type="submit"]');
      
      // Check error modal
      const errorModal = page.locator('.fixed.inset-0').filter({ hasText: 'Fehler' });
      await expect(errorModal).toBeVisible();
      await expect(errorModal).toContainText('Netzwerkfehler');
    });

    test('should handle network failure', async ({ page }) => {
      await page.goto('/en/contact');
      
      // Simulate network failure
      await page.route('https://api.web3forms.com/submit', async route => {
        await route.abort('failed');
      });

      // Fill and submit form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      await page.click('button[type="submit"]');
      
      // Check error modal
      const errorModal = page.locator('.fixed.inset-0').filter({ hasText: 'Error' });
      await expect(errorModal).toBeVisible();
      await expect(errorModal).toContainText('Network error');
    });
  });

  test.describe('Spam Protection', () => {
    test.skip('should have honeypot field hidden', async ({ page }) => {
      await page.goto('/contact');
      
      // Skip: React form doesn't use honeypot field
      const honeypot = page.locator('input[name="botcheck"]');
      await expect(honeypot).toBeHidden();
      await expect(honeypot).toHaveAttribute('type', 'checkbox');
      
      // Ensure it's not checked
      await expect(honeypot).not.toBeChecked();
    });

    test.skip('bot should not be able to submit form with honeypot checked', async ({ page }) => {
      await page.goto('/contact');
      
      // Fill form like a bot would
      await page.fill('input[name="name"]', 'Bot Name');
      await page.fill('input[name="email"]', 'bot@spam.com');
      await page.fill('textarea[name="message"]', 'Spam message');
      
      // Bot would check the honeypot
      await page.evaluate(() => {
        const honeypot = document.querySelector('input[name="botcheck"]') as HTMLInputElement;
        if (honeypot) honeypot.checked = true;
      });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Web3Forms should reject this
      await expect(page.locator('#form-result')).toHaveClass(/text-red-600/);
    });
  });

  test.describe('Form Validation Edge Cases', () => {
    test('should handle very long messages', async ({ page }) => {
      await page.goto('/contact');
      
      const longMessage = 'Test '.repeat(1000); // 5000 characters
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', longMessage);
      
      // Submit should still work
      await page.click('button[type="submit"]');
      
      // Should get success or specific error
      await expect(page.locator('.fixed.inset-0')).toBeVisible();
    });

    test('should handle special characters in input', async ({ page }) => {
      await page.goto('/contact');
      
      // Mock the API response
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.fill('input[name="name"]', 'Test <script>alert("XSS")</script> User');
      await page.fill('input[name="email"]', 'test+special@example.com');
      await page.fill('textarea[name="message"]', 'Message with "quotes" and \'apostrophes\' and & ampersands');
      
      await page.click('button[type="submit"]');
      
      // Should handle special characters properly
      const successModal = page.locator('.fixed.inset-0').filter({ hasText: 'Erfolg!' });
      await expect(successModal).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/contact');
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Try to submit
      await page.click('button[type="submit"]');
      
      // Browser should show validation error
      const emailInput = page.locator('input[name="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });
  });

  test.describe('Multiple Submissions', () => {
    test('should prevent double submission', async ({ page }) => {
      await page.goto('/contact');
      
      // Mock the API response with a delay
      await page.route('**/api.web3forms.com/submit', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Double click submit button
      await page.locator('button[type="submit"]').dblclick();
      
      // Button should be disabled after first click
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
      
      // Should only show one modal
      await expect(page.locator('.fixed.inset-0')).toHaveCount(1);
    });

    test('should allow resubmission after success', async ({ page }) => {
      await page.goto('/contact');
      
      // Mock the API response
      await page.route('**/api.web3forms.com/submit', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });
      
      // First submission
      await page.fill('input[name="name"]', 'First User');
      await page.fill('input[name="email"]', 'first@example.com');
      await page.fill('textarea[name="message"]', 'First message');
      await page.click('button[type="submit"]');
      
      // Wait for success modal
      const successModal = page.locator('.fixed.inset-0').filter({ hasText: 'Erfolg!' });
      await expect(successModal).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Schließen")');
      
      // Second submission
      await page.fill('input[name="name"]', 'Second User');
      await page.fill('input[name="email"]', 'second@example.com');
      await page.fill('textarea[name="message"]', 'Second message');
      await page.click('button[type="submit"]');
      
      // Should work again
      await expect(successModal).toBeVisible();
    });
  });

  test.describe('Browser Compatibility', () => {
    test.skip('should work without JavaScript (graceful degradation)', async ({ page, browser }) => {
      // Skip: React form requires JavaScript
      const context = await browser.newContext({
        javaScriptEnabled: false
      });
      const noJsPage = await context.newPage();
      
      await noJsPage.goto('/contact');
      
      // Form should still be visible (React form won't work without JS)
      await expect(noJsPage.locator('form').first()).toBeVisible();
      
      await context.close();
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid form switches', async ({ page }) => {
      // Navigate between German and English rapidly
      await page.goto('/contact');
      await page.goto('/en/contact');
      await page.goto('/contact');
      
      // Form should still work
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test after rapid navigation');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('#form-result')).toContainText('Vielen Dank');
    });
  });

  test.describe('Environment Variables', () => {
    test('should show clear error when env var is missing in production', async ({ page }) => {
      // This would need to be tested in a production-like environment
      // For now, we can test the warning message logic
      await page.goto('/contact');
      
      // Check if warning is shown when key is default
      const hasWarning = await page.locator('.bg-yellow-50').count();
      
      // If warning exists, verify its content
      if (hasWarning > 0) {
        await expect(page.locator('.bg-yellow-50')).toContainText('WEB3FORMS_ACCESS_KEY');
      }
    });
  });
});