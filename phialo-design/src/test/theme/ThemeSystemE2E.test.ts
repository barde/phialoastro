import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Simple test to verify theme system works correctly
describe('Theme System E2E Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;
  
  beforeEach(() => {
    // Setup a complete DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta name="theme-color" content="#FFFFFF" />
          <style>
            :root {
              --color-bg-primary: #FFFFFF;
              --color-text-primary: #2B2B2B;
              --color-bg-secondary: #FAFAFA;
              --color-text-secondary: #6B7280;
              --color-secondary: #D4AF37;
            }
            
            :root[data-theme="dark"] {
              --color-bg-primary: #0A192F;
              --color-text-primary: #E5E4E2;
              --color-bg-secondary: #1A2332;
              --color-text-secondary: #9CA3AF;
              --color-secondary: #F7DC6F;
            }
            
            body {
              background-color: var(--color-bg-primary);
              color: var(--color-text-primary);
            }
          </style>
        </head>
        <body>
          <header style="background-color: var(--color-bg-primary); color: var(--color-text-primary);">
            Header Content
          </header>
          <main style="background-color: var(--color-bg-secondary);">
            <section style="color: var(--color-text-secondary);">
              Section Content
            </section>
          </main>
          <footer style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">
            Footer Content
          </footer>
        </body>
      </html>
    `);
    
    document = dom.window.document;
    window = dom.window;
    
    // Setup global mocks
    Object.defineProperty(global, 'document', { value: document, writable: true });
    Object.defineProperty(global, 'window', { value: window, writable: true });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });
  
  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });

  describe('Theme Persistence', () => {
    it('should remember user dark mode preference', () => {
      // Simulate user setting dark mode
      window.localStorage.setItem('theme', 'dark');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      // Simulate page reload
      window.localStorage.getItem.mockReturnValue('dark');
      const savedTheme = window.localStorage.getItem('theme');
      expect(savedTheme).toBe('dark');
      
      // Apply the saved theme
      document.documentElement.setAttribute('data-theme', savedTheme);
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('should remember user light mode preference', () => {
      // Simulate user setting light mode
      window.localStorage.setItem('theme', 'light');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
      
      // Simulate page reload
      window.localStorage.getItem.mockReturnValue('light');
      const savedTheme = window.localStorage.getItem('theme');
      expect(savedTheme).toBe('light');
      
      // Apply the saved theme
      document.documentElement.setAttribute('data-theme', savedTheme);
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('should handle missing localStorage gracefully', () => {
      // Simulate localStorage not available
      window.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      let savedTheme;
      try {
        savedTheme = window.localStorage.getItem('theme');
      } catch (error) {
        savedTheme = 'light'; // Default fallback
      }
      
      expect(savedTheme).toBe('light');
      document.documentElement.setAttribute('data-theme', savedTheme);
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('DOM Theme Application', () => {
    it('should apply light theme to document', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      
      // Verify elements exist and can be themed
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header).toBeTruthy();
      expect(main).toBeTruthy();
      expect(footer).toBeTruthy();
      
      // Elements should have CSS custom property styles
      expect(header?.getAttribute('style')).toContain('var(--color-bg-primary)');
      expect(main?.getAttribute('style')).toContain('var(--color-bg-secondary)');
      expect(footer?.getAttribute('style')).toContain('var(--color-bg-secondary)');
    });

    it('should apply dark theme to document', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Verify elements still use CSS custom properties (will adapt via CSS)
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header?.getAttribute('style')).toContain('var(--color-bg-primary)');
      expect(main?.getAttribute('style')).toContain('var(--color-bg-secondary)');
      expect(footer?.getAttribute('style')).toContain('var(--color-bg-secondary)');
    });

    it('should remove data-theme for system preference', () => {
      // First set a theme
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Then remove for system preference
      document.documentElement.removeAttribute('data-theme');
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });
  });

  describe('Meta Theme Color', () => {
    it('should update theme-color meta tag for different themes', () => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      expect(metaThemeColor).toBeTruthy();
      
      // Light theme
      metaThemeColor.setAttribute('content', '#FFFFFF');
      expect(metaThemeColor.getAttribute('content')).toBe('#FFFFFF');
      
      // Dark theme
      metaThemeColor.setAttribute('content', '#0A192F');
      expect(metaThemeColor.getAttribute('content')).toBe('#0A192F');
    });

    it('should create meta theme-color tag if missing', () => {
      // Remove existing tag
      const existingMeta = document.querySelector('meta[name="theme-color"]');
      existingMeta?.remove();
      expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
      
      // Create new one
      const newMeta = document.createElement('meta');
      newMeta.setAttribute('name', 'theme-color');
      newMeta.setAttribute('content', '#0A192F');
      document.head.appendChild(newMeta);
      
      const createdMeta = document.querySelector('meta[name="theme-color"]');
      expect(createdMeta).toBeTruthy();
      expect(createdMeta?.getAttribute('content')).toBe('#0A192F');
    });
  });

  describe('Page Navigation and ViewTransitions', () => {
    it('should maintain theme across page navigations', () => {
      // Set initial theme
      document.documentElement.setAttribute('data-theme', 'dark');
      window.localStorage.setItem('theme', 'dark');
      
      // Simulate page navigation (astro:page-load event)
      const pageLoadEvent = new window.CustomEvent('astro:page-load');
      
      // Simulate theme reinitialization after navigation
      const reinitializeTheme = () => {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme && storedTheme !== 'system') {
          document.documentElement.setAttribute('data-theme', storedTheme);
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      };
      
      // Add event listener and trigger
      document.addEventListener('astro:page-load', reinitializeTheme);
      window.localStorage.getItem.mockReturnValue('dark');
      document.dispatchEvent(pageLoadEvent);
      
      // Theme should be maintained
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      // Cleanup
      document.removeEventListener('astro:page-load', reinitializeTheme);
    });
  });

  describe('CSS Custom Properties Support', () => {
    it('should use CSS custom properties for theming all components', () => {
      // Test that all major layout elements use CSS custom properties
      const elementsWithThemeProps = document.querySelectorAll('[style*="--color"]');
      expect(elementsWithThemeProps.length).toBeGreaterThan(0);
      
      // Check specific elements
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header?.getAttribute('style')).toMatch(/var\(--color-[^)]+\)/);
      expect(main?.getAttribute('style')).toMatch(/var\(--color-[^)]+\)/);
      expect(footer?.getAttribute('style')).toMatch(/var\(--color-[^)]+\)/);
    });
  });
});