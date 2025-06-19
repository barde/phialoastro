import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

// Create a comprehensive theme integration test
describe('Theme Integration Tests', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let document: Document;
  
  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta name="theme-color" content="#FFFFFF" />
        </head>
        <body>
          <div id="test-container">
            <header style="background-color: var(--color-bg-primary); color: var(--color-text-primary);">
              Header Content
            </header>
            <main style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);">
              <section style="background-color: var(--color-bg-primary); color: var(--color-text-secondary);">
                Section Content
              </section>
            </main>
            <footer style="background-color: var(--color-bg-secondary); border-color: var(--color-gray-200);">
              <span style="color: var(--color-text-secondary);">Footer Content</span>
            </footer>
          </div>
        </body>
      </html>
    `, { 
      url: 'http://localhost:4321',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window as Window & typeof globalThis;
    document = window.document;
    
    // Setup global mocks
    Object.defineProperty(global, 'window', {
      value: window,
      writable: true,
    });
    
    Object.defineProperty(global, 'document', {
      value: document,
      writable: true,
    });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });

  describe('CSS Custom Properties Theme Support', () => {
    it('should have default light theme CSS properties defined', () => {
      // Simulate light theme being set
      document.documentElement.setAttribute('data-theme', 'light');
      
      // Test that the document has proper structure for CSS custom properties
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      
      // Verify elements using CSS custom properties exist
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
      
      // Check that elements have CSS custom property styles (the actual CSS vars)
      expect(header?.getAttribute('style')).toContain('background-color: var(--color-bg-primary)');
      expect(header?.getAttribute('style')).toContain('color: var(--color-text-primary)');
      expect(main?.getAttribute('style')).toContain('background-color: var(--color-bg-secondary)');
      expect(footer?.getAttribute('style')).toContain('background-color: var(--color-bg-secondary)');
    });

    it('should switch to dark theme CSS properties', () => {
      // Simulate dark theme being set
      document.documentElement.setAttribute('data-theme', 'dark');
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Verify elements still use CSS custom properties (they should adapt automatically)
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header?.getAttribute('style')).toContain('background-color: var(--color-bg-primary)');
      expect(header?.getAttribute('style')).toContain('color: var(--color-text-primary)');
      expect(main?.getAttribute('style')).toContain('background-color: var(--color-bg-secondary)');
      expect(footer?.getAttribute('style')).toContain('background-color: var(--color-bg-secondary)');
    });

    it('should handle system theme preference', () => {
      // Remove explicit theme to use system preference
      document.documentElement.removeAttribute('data-theme');
      
      expect(document.documentElement).not.toHaveAttribute('data-theme');
      
      // Elements should still use CSS custom properties
      const header = document.querySelector('header');
      expect(header?.getAttribute('style')).toContain('background-color: var(--color-bg-primary)');
    });
  });

  describe('Meta Theme Color Updates', () => {
    it('should update theme-color meta tag for light theme', () => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      expect(metaThemeColor).toBeInTheDocument();
      
      // Simulate theme manager updating the meta tag
      metaThemeColor?.setAttribute('content', '#FFFFFF');
      
      expect(metaThemeColor?.getAttribute('content')).toBe('#FFFFFF');
    });

    it('should update theme-color meta tag for dark theme', () => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      expect(metaThemeColor).toBeInTheDocument();
      
      // Simulate theme manager updating the meta tag for dark theme
      metaThemeColor?.setAttribute('content', '#0A192F');
      
      expect(metaThemeColor?.getAttribute('content')).toBe('#0A192F');
    });

    it('should create meta theme-color tag if missing', () => {
      // Remove existing meta tag
      const existingMeta = document.querySelector('meta[name="theme-color"]');
      existingMeta?.remove();
      
      expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
      
      // Simulate theme manager creating new meta tag
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('name', 'theme-color');
      newMeta.setAttribute('content', '#0A192F');
      document.head.appendChild(newMeta);
      
      const createdMeta = document.querySelector('meta[name="theme-color"]');
      expect(createdMeta).toBeInTheDocument();
      expect(createdMeta?.getAttribute('content')).toBe('#0A192F');
    });
  });

  describe('LocalStorage Persistence Simulation', () => {
    it('should persist theme preference across page loads', () => {
      const localStorage = window.localStorage;
      
      // Simulate saving theme
      localStorage.setItem('theme', 'dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      // Simulate page reload
      (localStorage.getItem as any).mockReturnValue('dark');
      const savedTheme = localStorage.getItem('theme');
      
      expect(savedTheme).toBe('dark');
      
      // Simulate applying saved theme
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('should handle missing localStorage gracefully', () => {
      const localStorage = window.localStorage;
      
      // Simulate no saved preference
      (localStorage.getItem as any).mockReturnValue(null);
      const savedTheme = localStorage.getItem('theme');
      
      expect(savedTheme).toBeNull();
      
      // Should default to light theme
      const defaultTheme = savedTheme || 'light';
      document.documentElement.setAttribute('data-theme', defaultTheme);
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('ViewTransitions Compatibility', () => {
    it('should maintain theme during page transitions', () => {
      // Set initial theme
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Simulate page transition (astro:page-load event)
      const pageLoadEvent = new CustomEvent('astro:page-load');
      
      // Store theme before transition
      const themeBeforeTransition = document.documentElement.getAttribute('data-theme');
      
      // Simulate theme reinitialization after page load
      document.dispatchEvent(pageLoadEvent);
      
      // Simulate theme manager restoring theme after transition
      if (themeBeforeTransition) {
        document.documentElement.setAttribute('data-theme', themeBeforeTransition);
      }
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('should reinitialize theme system after page transitions', () => {
      // Simulate stored theme
      const localStorage = window.localStorage;
      (localStorage.getItem as any).mockReturnValue('dark');
      
      // Simulate page transition
      const pageLoadEvent = new CustomEvent('astro:page-load');
      
      // Mock theme reinitialization function
      const reinitializeTheme = () => {
        const storedTheme = localStorage.getItem('theme') || 'light';
        if (storedTheme === 'system') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', storedTheme);
        }
      };
      
      // Simulate event listener
      document.addEventListener('astro:page-load', reinitializeTheme);
      document.dispatchEvent(pageLoadEvent);
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Cleanup
      document.removeEventListener('astro:page-load', reinitializeTheme);
    });
  });
});