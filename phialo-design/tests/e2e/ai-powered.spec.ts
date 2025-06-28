import { test, expect } from '@playwright/test';
import { ai } from '@zerostep/playwright';
import { AITestHelper, SelfHealingSelectors, AITestDataGenerator } from './helpers/ai-test-helper';

/**
 * AI-Powered E2E Tests
 * These tests use natural language and AI to be more maintainable
 */

test.describe('AI-Powered Tests', () => {
  test('@ai Natural language navigation test', async ({ page }) => {
    const aiHelper = new AITestHelper(page);
    
    await page.goto('/');
    
    // Use natural language for navigation
    await aiHelper.click("Click on the Portfolio link in the navigation");
    
    // Verify navigation worked
    await expect(page).toHaveURL(/\/portfolio/);
    
    // Use AI to verify content
    await aiHelper.verify("The page should show a grid of portfolio items with images");
    
    // Extract information
    const itemCount = await aiHelper.extract("Count how many portfolio items are visible on the page");
    console.log(`Found ${itemCount} portfolio items`);
  });

  test('@ai Self-healing form submission', async ({ page }) => {
    const selectors = new SelfHealingSelectors(page);
    
    await page.goto('/contact');
    
    // Use self-healing selectors that try multiple strategies
    await selectors.fill(
      {
        testId: 'name-input',
        ariaLabel: 'Name',
        nearText: 'Name',
        aiDescription: 'The name input field in the contact form',
      },
      'AI Test User'
    );
    
    await selectors.fill(
      {
        testId: 'email-input',
        ariaLabel: 'Email',
        nearText: 'E-Mail',
        aiDescription: 'The email input field',
      },
      'ai.test@example.com'
    );
    
    // Use AI for complex interactions
    await ai('Fill in the message field with "This is an AI-powered test message to verify the contact form works correctly"', 
      { page, test }
    );
    
    // Submit with self-healing
    await selectors.click({
      testId: 'submit-button',
      text: 'Senden',
      role: 'button',
      aiDescription: 'The submit button at the bottom of the form',
    });
    
    // Verify success
    await ai('Verify that a success message appears after form submission', { page, test });
  });

  test('@ai @smoke AI-powered smoke test', async ({ page }) => {
    await page.goto('/');
    
    // Use AI to run through critical user journey
    const testSteps = [
      'Verify the homepage loads with a hero section and navigation',
      'Click on the language selector and switch to English',
      'Verify the URL now contains /en/',
      'Navigate to the Portfolio section',
      'Verify portfolio items are displayed',
      'Click on the first portfolio item',
      'Verify a modal or detail view opens',
      'Close the modal',
      'Navigate to the Contact page',
      'Verify the contact form is visible',
    ];
    
    for (const step of testSteps) {
      console.log(`Executing: ${step}`);
      await ai(step, { page, test });
    }
  });

  test('@ai Context-aware test data generation', async ({ page }) => {
    await page.goto('/contact');
    
    // Generate context-aware test data
    const formData = await AITestDataGenerator.generateFormData('German contact form');
    
    // Fill form with generated data
    await ai(`Enter "${formData.name}" in the name field`, { page, test });
    await ai(`Enter "${formData.email}" in the email field`, { page, test });
    await ai(`Enter "${formData.message}" in the message field`, { page, test });
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'ai-generated-form.png' });
  });

  test('@ai Visual regression with AI analysis', async ({ page }) => {
    await page.goto('/');
    
    // Take screenshot
    await page.screenshot({ path: 'homepage-current.png', fullPage: true });
    
    // Use AI to analyze the visual state
    const visualAnalysis = await ai(
      'Analyze the page and describe: 1) The color scheme, 2) The layout structure, 3) Any visual issues or misalignments',
      { page, test }
    );
    
    console.log('AI Visual Analysis:', visualAnalysis);
    
    // Verify specific visual elements
    await ai('Verify that the hero section has a clean, minimal design with no floating elements', { page, test });
    await ai('Check that all images are loaded correctly and not broken', { page, test });
  });

  test('@ai Mobile responsiveness with AI', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    await page.goto('/');
    
    // AI-powered mobile testing
    await ai('Verify the page is responsive and displays correctly on mobile', { page, test });
    await ai('Click the mobile menu button (hamburger icon)', { page, test });
    await ai('Verify the mobile menu opens and shows navigation options', { page, test });
    await ai('Navigate to Portfolio using the mobile menu', { page, test });
    
    // Verify mobile-specific behaviors
    await ai('Verify that portfolio items stack vertically on mobile', { page, test });
    await ai('Check that touch interactions work (try tapping a portfolio item)', { page, test });
  });
});

test.describe('AI Test Generation', () => {
  test('@ai Generate tests from user behavior', async ({ page }) => {
    // This test demonstrates how AI can generate new test scenarios
    const scenarios = await AITestDataGenerator.generateScenarios(page);
    
    console.log('AI Generated Test Scenarios:');
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario}`);
    });
    
    // Execute first generated scenario
    if (scenarios.length > 0) {
      await page.goto('/');
      await ai(scenarios[0], { page, test });
    }
  });

  test('@ai Self-documenting test', async ({ page }) => {
    await page.goto('/');
    
    // AI documents what it's testing
    const testPlan = await ai(
      'Analyze this page and create a test plan for the most critical functionality',
      { page, test }
    );
    
    console.log('AI Generated Test Plan:', testPlan);
    
    // Execute the first critical test
    await ai('Execute the most critical test from the plan above', { page, test });
  });
});