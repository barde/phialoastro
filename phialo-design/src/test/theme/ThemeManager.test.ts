import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeManager, getThemeManager, type Theme } from '../../scripts/theme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock document and HTML element
const createMockDocument = () => ({
  documentElement: {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
  },
  querySelector: vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
  }),
  createElement: vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
  }),
  head: {
    appendChild: vi.fn(),
  },
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let documentMock: any;
  
  beforeEach(() => {
    // Create fresh document mock for each test
    documentMock = createMockDocument();
    
    // Setup DOM mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });
    
    Object.defineProperty(global, 'document', {
      value: documentMock,
      writable: true,
    });
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset localStorage to return null by default
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset matchMedia to return light mode by default
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    
    // Create fresh instance for each test
    themeManager = new ThemeManager();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Persistence', () => {
    it('should default to light theme when no saved preference exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const manager = new ThemeManager();
      
      expect(manager.getTheme()).toBe('light');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should restore saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      const manager = new ThemeManager();
      
      expect(manager.getTheme()).toBe('dark');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should save theme to localStorage when changed', () => {
      themeManager.setTheme('dark');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(themeManager.getTheme()).toBe('dark');
    });

    it('should not save to localStorage when persist is false', () => {
      themeManager.setTheme('dark', false);
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(themeManager.getTheme()).toBe('dark');
    });
  });

  describe('Theme Switching', () => {
    it('should toggle between light and dark themes', () => {
      expect(themeManager.getTheme()).toBe('light');
      
      themeManager.toggleTheme();
      expect(themeManager.getTheme()).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      themeManager.toggleTheme();
      expect(themeManager.getTheme()).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should set explicit theme correctly', () => {
      themeManager.setTheme('dark');
      expect(themeManager.getTheme()).toBe('dark');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      themeManager.setTheme('light');
      expect(themeManager.getTheme()).toBe('light');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should handle system theme correctly', () => {
      themeManager.setTheme('system');
      expect(themeManager.getTheme()).toBe('system');
      expect(documentMock.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    });
  });

  describe('System Preference Detection', () => {
    it('should detect light system preference correctly', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      themeManager.setTheme('system');
      expect(themeManager.getEffectiveTheme()).toBe('light');
    });

    it('should detect dark system preference correctly', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      themeManager.setTheme('system');
      expect(themeManager.getEffectiveTheme()).toBe('dark');
    });

    it('should return explicit theme when not using system', () => {
      themeManager.setTheme('dark');
      expect(themeManager.getEffectiveTheme()).toBe('dark');
      
      themeManager.setTheme('light');
      expect(themeManager.getEffectiveTheme()).toBe('light');
    });
  });

  describe('DOM Updates', () => {
    it('should update document data-theme attribute for explicit themes', () => {
      themeManager.setTheme('dark');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      themeManager.setTheme('light');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should remove data-theme attribute for system theme', () => {
      themeManager.setTheme('system');
      expect(documentMock.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    });

    it('should update meta theme-color tag', () => {
      const metaElement = { setAttribute: vi.fn() };
      documentMock.querySelector.mockReturnValue(metaElement);
      
      themeManager.setTheme('dark');
      expect(metaElement.setAttribute).toHaveBeenCalledWith('content', '#0A192F');
      
      themeManager.setTheme('light');
      expect(metaElement.setAttribute).toHaveBeenCalledWith('content', '#FFFFFF');
    });

    it('should create meta theme-color tag if it does not exist', () => {
      const metaElement = { setAttribute: vi.fn() };
      documentMock.querySelector.mockReturnValue(null);
      documentMock.createElement.mockReturnValue(metaElement);
      
      themeManager.setTheme('dark');
      
      expect(documentMock.createElement).toHaveBeenCalledWith('meta');
      expect(metaElement.setAttribute).toHaveBeenCalledWith('name', 'theme-color');
      expect(metaElement.setAttribute).toHaveBeenCalledWith('content', '#0A192F');
      expect(documentMock.head.appendChild).toHaveBeenCalledWith(metaElement);
    });
  });

  describe('Callbacks and Subscriptions', () => {
    it('should notify subscribers when theme changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = themeManager.subscribe(callback1);
      const unsubscribe2 = themeManager.subscribe(callback2);
      
      themeManager.setTheme('dark');
      
      expect(callback1).toHaveBeenCalledWith('dark');
      expect(callback2).toHaveBeenCalledWith('dark');
      
      // Test unsubscribe
      unsubscribe1();
      themeManager.setTheme('light');
      
      expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(callback2).toHaveBeenCalledWith('light');
      
      unsubscribe2();
    });
  });

  describe('Global Instance', () => {
    it('should return same instance from getThemeManager', () => {
      const instance1 = getThemeManager();
      const instance2 = getThemeManager();
      
      expect(instance1).toBe(instance2);
    });
  });
});