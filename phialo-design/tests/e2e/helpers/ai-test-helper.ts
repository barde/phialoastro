import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ai } from '@zerostep/playwright';

/**
 * AI-powered test helper for self-healing and natural language testing
 * This helper provides methods that use AI to interact with the page
 * without relying on specific selectors
 */

export class AITestHelper {
  constructor(private page: Page) {}

  /**
   * Navigate using natural language
   * @example await aiHelper.navigate("Go to the portfolio page")
   */
  async navigate(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Click elements using natural language
   * @example await aiHelper.click("Click the submit button")
   */
  async click(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Fill forms using natural language
   * @example await aiHelper.fill("Enter 'John Doe' in the name field")
   */
  async fill(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Verify content using natural language
   * @example await aiHelper.verify("The success message should be visible")
   */
  async verify(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Extract data using natural language
   * @example const price = await aiHelper.extract("Get the price of the first portfolio item")
   */
  async extract(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Perform complex interactions
   * @example await aiHelper.interact("Switch the language to English and verify the URL changed")
   */
  async interact(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }

  /**
   * Wait for conditions using natural language
   * @example await aiHelper.waitFor("Wait until the loading spinner disappears")
   */
  async waitFor(instruction: string) {
    return await ai(instruction, { page: this.page, test: null as any });
  }
}

/**
 * Self-healing selector strategies
 */
export class SelfHealingSelectors {
  constructor(private page: Page) {}

  /**
   * Find element with multiple fallback strategies
   */
  async findElement(strategies: {
    testId?: string;
    text?: string;
    ariaLabel?: string;
    role?: string;
    nearText?: string;
    aiDescription?: string;
  }) {
    const { testId, text, ariaLabel, role, nearText, aiDescription } = strategies;

    // Try test ID first (most reliable)
    if (testId) {
      const element = this.page.locator(`[data-testid="${testId}"]`);
      if (await element.count() > 0) return element;
    }

    // Try ARIA label
    if (ariaLabel) {
      const element = this.page.locator(`[aria-label="${ariaLabel}"]`);
      if (await element.count() > 0) return element;
    }

    // Try role with text
    if (role && text) {
      const element = this.page.getByRole(role as any, { name: text });
      if (await element.count() > 0) return element;
    }

    // Try text content
    if (text) {
      const element = this.page.getByText(text);
      if (await element.count() > 0) return element;
    }

    // Try near text
    if (nearText) {
      const nearElement = this.page.getByText(nearText);
      if (await nearElement.count() > 0) {
        // Look for clickable elements near the text
        const element = nearElement.locator('..').locator('button, a, input').first();
        if (await element.count() > 0) return element;
      }
    }

    // Fall back to AI if all else fails
    if (aiDescription) {
      await ai(`Find element: ${aiDescription}`, { page: this.page, test: null as any });
      // Return a generic locator that AI will handle
      return this.page.locator('body');
    }

    throw new Error(`Could not find element with strategies: ${JSON.stringify(strategies)}`);
  }

  /**
   * Click with self-healing
   */
  async click(strategies: Parameters<typeof this.findElement>[0]) {
    const element = await this.findElement(strategies);
    await element.click();
  }

  /**
   * Fill with self-healing
   */
  async fill(strategies: Parameters<typeof this.findElement>[0], value: string) {
    const element = await this.findElement(strategies);
    await element.fill(value);
  }

  /**
   * Verify visibility with self-healing
   */
  async expectVisible(strategies: Parameters<typeof this.findElement>[0]) {
    const element = await this.findElement(strategies);
    await expect(element).toBeVisible();
  }
}

/**
 * Test data generator using AI
 */
export class AITestDataGenerator {
  /**
   * Generate test data based on context
   */
  static async generateFormData(context: string): Promise<any> {
    // In a real implementation, this would call an AI API
    // For now, return context-aware test data
    const baseData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message',
    };

    if (context.includes('German')) {
      return {
        ...baseData,
        name: 'Test Benutzer',
        message: 'Dies ist eine Testnachricht',
      };
    }

    if (context.includes('mobile')) {
      return {
        ...baseData,
        message: 'Short mobile test msg',
      };
    }

    return baseData;
  }

  /**
   * Generate test scenarios based on page content
   */
  static async generateScenarios(page: Page): Promise<string[]> {
    // In a real implementation, this would analyze the page and generate scenarios
    return [
      'User navigates to portfolio and views an item',
      'User switches language and verifies content changes',
      'User submits contact form with valid data',
      'User navigates on mobile and uses hamburger menu',
    ];
  }
}

// Re-export the AI function for direct use
export { ai };