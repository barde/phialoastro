/**
 * Page Translation Tests
 * Tests all pages in both German and English versions
 * Verifies correct content language and URL routing
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  testBothLanguages,
  mockAstroUrl,
  getLanguageFromPath,
  generateAlternativeLanguageUrl,
  type LanguageContext
} from '../utils/i18n-test-utils';

describe('Page Translations', () => {
  // Test homepage translation
  testBothLanguages('Homepage', (context: LanguageContext) => {
    test('displays correct language URL structure', () => {
      const expectedPath = context.isEnglish ? '/en/' : '/';
      expect(context.currentPath).toBe(expectedPath);
      expect(getLanguageFromPath(context.currentPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative language URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(context.currentPath);
      const expectedAlternative = context.isEnglish ? '/' : '/en/';
      expect(alternativeUrl).toBe(expectedAlternative);
    });

    test('has correct language prefix in URL', () => {
      if (context.isEnglish) {
        expect(context.currentPath).toMatch(/^\/en/);
      } else {
        expect(context.currentPath).not.toMatch(/^\/en/);
      }
    });
  });

  // Test about page translation
  testBothLanguages('About Page', (context: LanguageContext) => {
    const aboutPath = context.isEnglish ? '/en/about' : '/about';

    test('has correct about page URL structure', () => {
      expect(getLanguageFromPath(aboutPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative about URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(aboutPath);
      const expected = context.isEnglish ? '/about' : '/en/about';
      expect(alternativeUrl).toBe(expected);
    });
  });

  // Test portfolio page translation
  testBothLanguages('Portfolio Page', (context: LanguageContext) => {
    const portfolioPath = context.isEnglish ? '/en/portfolio/' : '/portfolio/';

    test('has correct portfolio page URL structure', () => {
      expect(getLanguageFromPath(portfolioPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative portfolio URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(portfolioPath);
      const expected = context.isEnglish ? '/portfolio/' : '/en/portfolio/';
      expect(alternativeUrl).toBe(expected);
    });
  });

  // Test services page translation
  testBothLanguages('Services Page', (context: LanguageContext) => {
    const servicesPath = context.isEnglish ? '/en/services/' : '/services/';

    test('has correct services page URL structure', () => {
      expect(getLanguageFromPath(servicesPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative services URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(servicesPath);
      const expected = context.isEnglish ? '/services/' : '/en/services/';
      expect(alternativeUrl).toBe(expected);
    });
  });

  // Test tutorials page translation
  testBothLanguages('Tutorials Page', (context: LanguageContext) => {
    const tutorialsPath = context.isEnglish ? '/en/tutorials/' : '/tutorials/';

    test('has correct tutorials page URL structure', () => {
      expect(getLanguageFromPath(tutorialsPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative tutorials URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(tutorialsPath);
      const expected = context.isEnglish ? '/tutorials/' : '/en/tutorials/';
      expect(alternativeUrl).toBe(expected);
    });
  });

  // Test contact page translation
  testBothLanguages('Contact Page', (context: LanguageContext) => {
    const contactPath = context.isEnglish ? '/en/contact' : '/contact';

    test('has correct contact page URL structure', () => {
      expect(getLanguageFromPath(contactPath)).toBe(context.expectedLanguage);
    });

    test('generates correct alternative contact URL', () => {
      const alternativeUrl = generateAlternativeLanguageUrl(contactPath);
      const expected = context.isEnglish ? '/contact' : '/en/contact';
      expect(alternativeUrl).toBe(expected);
    });
  });

  // Test 404 page handling
  describe('404 Page Language Handling', () => {
    test('404 page maintains language context', () => {
      const paths = ['/404', '/en/404'];
      
      paths.forEach(path => {
        const language = getLanguageFromPath(path);
        const expectedLanguage = path.startsWith('/en') ? 'en' : 'de';
        expect(language).toBe(expectedLanguage);
      });
    });
  });

  // Test URL normalization
  describe('URL Normalization', () => {
    test('handles trailing slashes correctly', () => {
      const testCases = [
        { input: '/en/portfolio', expected: 'en' },
        { input: '/en/portfolio/', expected: 'en' },
        { input: '/portfolio', expected: 'de' },
        { input: '/portfolio/', expected: 'de' },
        { input: '/en', expected: 'en' },
        { input: '/en/', expected: 'en' },
        { input: '/', expected: 'de' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getLanguageFromPath(input)).toBe(expected);
      });
    });

    test('handles edge cases in URL structure', () => {
      const edgeCases = [
        { input: '/en/about/extra', expected: 'en' },
        { input: '/en/services/custom', expected: 'en' },
        { input: '/portfolio/rings', expected: 'de' },
        { input: '/tutorials/care', expected: 'de' }
      ];

      edgeCases.forEach(({ input, expected }) => {
        expect(getLanguageFromPath(input)).toBe(expected);
      });
    });
  });

  // Test bilingual URL generation
  describe('Bilingual URL Generation', () => {
    test('correctly converts German URLs to English', () => {
      const germanUrls = [
        { input: '/', expected: '/en/' },
        { input: '/about', expected: '/en/about' },
        { input: '/portfolio/', expected: '/en/portfolio/' },
        { input: '/services/', expected: '/en/services/' },
        { input: '/tutorials/', expected: '/en/tutorials/' },
        { input: '/contact', expected: '/en/contact' }
      ];

      germanUrls.forEach(({ input, expected }) => {
        expect(generateAlternativeLanguageUrl(input)).toBe(expected);
      });
    });

    test('correctly converts English URLs to German', () => {
      const englishUrls = [
        { input: '/en/', expected: '/' },
        { input: '/en/about', expected: '/about' },
        { input: '/en/portfolio/', expected: '/portfolio/' },
        { input: '/en/services/', expected: '/services/' },
        { input: '/en/tutorials/', expected: '/tutorials/' },
        { input: '/en/contact', expected: '/contact' }
      ];

      englishUrls.forEach(({ input, expected }) => {
        expect(generateAlternativeLanguageUrl(input)).toBe(expected);
      });
    });
  });

  // Test Astro URL object compatibility
  describe('Astro URL Object Integration', () => {
    test('mock Astro URL object works correctly', () => {
      const testPaths = ['/', '/en/', '/about', '/en/about'];
      
      testPaths.forEach(path => {
        const astroUrl = mockAstroUrl(path);
        expect(astroUrl.pathname).toBe(path);
        expect(astroUrl.href).toBe(`https://phialo.de${path}`);
        expect(astroUrl.origin).toBe('https://phialo.de');
      });
    });

    test('language detection works with Astro URL objects', () => {
      const astroUrls = [
        { path: '/', expectedLang: 'de' },
        { path: '/en/', expectedLang: 'en' },
        { path: '/about', expectedLang: 'de' },
        { path: '/en/about', expectedLang: 'en' },
        { path: '/portfolio/', expectedLang: 'de' },
        { path: '/en/portfolio/', expectedLang: 'en' }
      ];

      astroUrls.forEach(({ path, expectedLang }) => {
        const astroUrl = mockAstroUrl(path);
        expect(getLanguageFromPath(astroUrl.pathname)).toBe(expectedLang);
      });
    });
  });

  // Test page routing consistency
  describe('Page Routing Consistency', () => {
    test('all pages have consistent language routing pattern', () => {
      const pageRoutes = [
        'about',
        'portfolio/',
        'services/',
        'tutorials/',
        'contact'
      ];

      pageRoutes.forEach(route => {
        const germanPath = `/${route}`;
        const englishPath = `/en/${route}`;
        
        // Test German to English conversion
        expect(generateAlternativeLanguageUrl(germanPath)).toBe(englishPath);
        
        // Test English to German conversion
        expect(generateAlternativeLanguageUrl(englishPath)).toBe(germanPath);
        
        // Test language detection
        expect(getLanguageFromPath(germanPath)).toBe('de');
        expect(getLanguageFromPath(englishPath)).toBe('en');
      });
    });

    test('homepage routing is handled correctly', () => {
      // German homepage
      expect(getLanguageFromPath('/')).toBe('de');
      expect(generateAlternativeLanguageUrl('/')).toBe('/en/');
      
      // English homepage
      expect(getLanguageFromPath('/en/')).toBe('en');
      expect(generateAlternativeLanguageUrl('/en/')).toBe('/');
      
      // Handle /en without trailing slash
      expect(getLanguageFromPath('/en')).toBe('en');
      expect(generateAlternativeLanguageUrl('/en')).toBe('/');
    });
  });
});