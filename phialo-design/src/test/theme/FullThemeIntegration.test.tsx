import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { getThemeManager } from '../../scripts/theme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Full Theme Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('light');
    document.documentElement.removeAttribute('data-theme');
    
    // Reset global theme manager
    const themeManager = getThemeManager();
    themeManager.setTheme('light', false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Toggle Component Integration', () => {
    it('should toggle theme and persist preference', async () => {
      render(<ThemeToggle />);
      
      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
      
      const button = screen.getByRole('button');
      
      // Initially should be in light mode (moon icon)
      expect(button).toHaveAttribute('title', 'Dunkel');
      
      // Click to switch to dark mode
      fireEvent.click(button);
      
      // Should have called localStorage.setItem to save the new theme
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      // Wait for state update
      await waitFor(() => {
        expect(button).toHaveAttribute('title', 'Hell');
      });
      
      // Click again to switch back to light mode
      fireEvent.click(button);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
      
      await waitFor(() => {
        expect(button).toHaveAttribute('title', 'Dunkel');
      });
    });

    it('should restore theme from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(<ThemeToggle />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Hell');
      });
    });

    it('should handle system theme preference when no saved preference', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      // Mock system preference for dark mode
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      render(<ThemeToggle />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        // Should show sun icon since it detects dark system preference
        expect(button).toHaveAttribute('title', 'Hell');
      });
    });
  });

  describe('DOM Theme Application', () => {
    it('should apply data-theme attribute to document element', () => {
      const themeManager = getThemeManager();
      
      themeManager.setTheme('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      
      themeManager.setTheme('light');
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      
      themeManager.setTheme('system');
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });

    it('should update meta theme-color tag', () => {
      const themeManager = getThemeManager();
      
      // Create or get existing meta tag
      let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      
      themeManager.setTheme('light');
      expect(metaThemeColor.getAttribute('content')).toBe('#FFFFFF');
      
      themeManager.setTheme('dark');
      expect(metaThemeColor.getAttribute('content')).toBe('#0A192F');
    });
  });

  describe('Theme Persistence Across Sessions', () => {
    it('should remember user preference across page reloads', () => {
      const themeManager = getThemeManager();
      
      // Simulate user setting dark theme
      themeManager.setTheme('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      // Simulate page reload by creating new theme manager instance
      localStorageMock.getItem.mockReturnValue('dark');
      const newThemeManager = getThemeManager();
      
      // Should restore the saved theme
      expect(newThemeManager.getTheme()).toBe('dark');
    });

    it('should handle missing localStorage gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not crash when localStorage is not available
      expect(() => {
        const themeManager = getThemeManager();
        themeManager.setTheme('dark');
      }).not.toThrow();
    });
  });

  describe('Callback System', () => {
    it('should notify subscribers of theme changes', () => {
      const themeManager = getThemeManager();
      const callback = vi.fn();
      
      const unsubscribe = themeManager.subscribe(callback);
      
      themeManager.setTheme('dark');
      expect(callback).toHaveBeenCalledWith('dark');
      
      themeManager.setTheme('light');
      expect(callback).toHaveBeenCalledWith('light');
      
      // Test unsubscribe
      unsubscribe();
      themeManager.setTheme('dark');
      expect(callback).toHaveBeenCalledTimes(2); // Should not be called again
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      const themeManager = getThemeManager();
      
      // Rapid theme changes should not cause issues
      themeManager.setTheme('dark');
      themeManager.setTheme('light');
      themeManager.setTheme('dark');
      themeManager.setTheme('system');
      themeManager.setTheme('light');
      
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      expect(themeManager.getTheme()).toBe('light');
    });

    it('should handle invalid theme values gracefully', () => {
      const themeManager = getThemeManager();
      
      // TypeScript would prevent this, but test runtime behavior
      expect(() => {
        (themeManager as any).setTheme('invalid');
      }).not.toThrow();
    });
  });
});