/**
 * Testing utilities for internationalization (i18n) functionality
 * Provides helpers for testing bilingual content and language switching
 */

import { vi, expect } from 'vitest';

export interface LanguageContext {
  isEnglish: boolean;
  currentPath: string;
  expectedLanguage: 'de' | 'en';
  languagePrefix: string;
}

/**
 * Helper to run tests for both German and English versions
 */
export const testBothLanguages = (
  testName: string,
  testFunction: (context: LanguageContext) => void | Promise<void>
) => {
  describe(`${testName} - German version`, () => {
    const context: LanguageContext = {
      isEnglish: false,
      currentPath: '/',
      expectedLanguage: 'de',
      languagePrefix: ''
    };
    testFunction(context);
  });

  describe(`${testName} - English version`, () => {
    const context: LanguageContext = {
      isEnglish: true,
      currentPath: '/en/',
      expectedLanguage: 'en',
      languagePrefix: '/en'
    };
    testFunction(context);
  });
};

/**
 * Mock window.location for different language contexts
 */
export const mockWindowLocation = (pathname: string, href?: string) => {
  const mockLocation = {
    pathname,
    href: href || `https://phialo.de${pathname}`,
    replace: vi.fn(),
    assign: vi.fn(),
    reload: vi.fn(),
    origin: 'https://phialo.de',
    protocol: 'https:',
    host: 'phialo.de',
    hostname: 'phialo.de',
    port: '',
    search: '',
    hash: ''
  };

  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
    configurable: true
  });

  return mockLocation;
};

/**
 * Mock localStorage for language preference testing
 */
export const mockLocalStorage = () => {
  const storage = new Map<string, string>();
  
  const mockStorage = {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
    length: storage.size,
    key: vi.fn((index: number) => {
      const keys = Array.from(storage.keys());
      return keys[index] || null;
    })
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });

  return { mockStorage, storage };
};

/**
 * Mock Astro URL object for server-side testing
 */
export const mockAstroUrl = (pathname: string) => {
  return {
    pathname,
    href: `https://phialo.de${pathname}`,
    origin: 'https://phialo.de',
    protocol: 'https:',
    hostname: 'phialo.de',
    port: '',
    search: '',
    searchParams: new URLSearchParams(),
    hash: ''
  };
};

/**
 * Extract language from URL pathname
 */
export const getLanguageFromPath = (pathname: string): 'de' | 'en' => {
  return pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'de';
};

/**
 * Generate URL for opposite language
 */
export const generateAlternativeLanguageUrl = (currentPath: string): string => {
  const isEnglish = currentPath.startsWith('/en/') || currentPath === '/en';
  
  if (isEnglish) {
    // Convert English to German
    return currentPath.replace(/^\/en/, '') || '/';
  } else {
    // Convert German to English
    return '/en' + currentPath;
  }
};

/**
 * Mock document.querySelector for language selector testing
 */
export const mockQuerySelector = () => {
  const elements = new Map<string, HTMLElement[]>();
  
  const addMockElement = (selector: string, element: Partial<HTMLElement>) => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      click: vi.fn(),
      dataset: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn()
      },
      ...element
    } as HTMLElement;
    
    const existing = elements.get(selector) || [];
    elements.set(selector, [...existing, mockElement]);
    
    return mockElement;
  };

  const mockQuerySelector = vi.fn((selector: string) => {
    const elementList = elements.get(selector);
    return elementList ? elementList[0] : null;
  });

  const mockQuerySelectorAll = vi.fn((selector: string) => {
    const elementList = elements.get(selector) || [];
    return {
      forEach: (callback: (element: HTMLElement, index: number) => void) => {
        elementList.forEach(callback);
      },
      length: elementList.length,
      [Symbol.iterator]: function* () {
        for (const element of elementList) {
          yield element;
        }
      }
    } as NodeListOf<HTMLElement>;
  });

  Object.defineProperty(document, 'querySelector', {
    value: mockQuerySelector,
    writable: true,
    configurable: true
  });

  Object.defineProperty(document, 'querySelectorAll', {
    value: mockQuerySelectorAll,
    writable: true,
    configurable: true
  });

  return { addMockElement, mockQuerySelector, mockQuerySelectorAll };
};

/**
 * Mock document ready state for testing initialization
 */
export const mockDocumentReadyState = (state: 'loading' | 'interactive' | 'complete') => {
  Object.defineProperty(document, 'readyState', {
    value: state,
    writable: true,
    configurable: true
  });
};

/**
 * Common language selector constants for testing
 */
export const LANGUAGE_SELECTOR_CONSTANTS = {
  STORAGE_KEY: 'preferred-language',
  DEFAULT_LANG: 'de',
  LANG_BUTTON_SELECTOR: '.lang-button',
  ACTIVE_CLASS: 'active'
} as const;

/**
 * Helper to test language-specific content
 */
export const expectLanguageSpecificContent = (
  container: HTMLElement,
  content: { de: string; en: string },
  currentLanguage: 'de' | 'en'
) => {
  const expectedContent = content[currentLanguage];
  const unexpectedContent = content[currentLanguage === 'de' ? 'en' : 'de'];
  
  expect(container.textContent).toContain(expectedContent);
  expect(container.textContent).not.toContain(unexpectedContent);
};

/**
 * Mock console methods for testing error handling
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  const mockMethods = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };

  Object.assign(console, mockMethods);

  const restore = () => {
    Object.assign(console, originalConsole);
  };

  return { mockMethods, restore };
};

/**
 * Test data for common translations
 */
export const TEST_TRANSLATIONS = {
  navigation: {
    home: { de: 'Startseite', en: 'Home' },
    about: { de: 'Über mich', en: 'About' },
    portfolio: { de: 'Portfolio', en: 'Portfolio' },
    services: { de: 'Leistungen', en: 'Services' },
    tutorials: { de: 'Tutorials', en: 'Tutorials' },
    contact: { de: 'Kontakt', en: 'Contact' }
  },
  common: {
    readMore: { de: 'Mehr lesen', en: 'Read more' },
    learnMore: { de: 'Mehr erfahren', en: 'Learn more' },
    viewProject: { de: 'Projekt ansehen', en: 'View project' },
    backToTop: { de: 'Nach oben', en: 'Back to top' }
  },
  portfolio: {
    category: { de: 'Kategorie', en: 'Category' },
    materials: { de: 'Materialien', en: 'Materials' },
    availability: { de: 'Verfügbarkeit', en: 'Availability' },
    dimensions: { de: 'Abmessungen', en: 'Dimensions' }
  }
} as const;