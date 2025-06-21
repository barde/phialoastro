import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ThemeProvider, { useTheme } from '../../../components/common/ThemeProvider';

// Test component to access theme context
const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.className = '';
  });

  it('should initialize with light theme by default', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  it('should initialize with saved theme from localStorage', async () => {
    localStorage.setItem('phialo-theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  it('should toggle between light and dark themes', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    await user.click(screen.getByText('Toggle Theme'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    await user.click(screen.getByText('Toggle Theme'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  it('should set specific theme', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    await user.click(screen.getByText('Set Light'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  it('should save theme preference to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(localStorage.getItem('phialo-theme')).toBe('dark');
    });
  });

  it('should apply theme classes to document root', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('theme-light');
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    await user.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('theme-dark');
      expect(document.documentElement).not.toHaveClass('theme-light');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  it('should respect system color scheme preference', async () => {
    // Mock matchMedia to return dark preference
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  it('should handle localStorage errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock localStorage.setItem to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not save theme preference to localStorage:',
        expect.any(Error)
      );
    });

    // Theme should still update even if localStorage fails
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Restore
    localStorage.setItem = originalSetItem;
    consoleSpy.mockRestore();
  });

  it('should throw error when useTheme is used outside of ThemeProvider', () => {
    const TestComponentWithoutProvider = () => {
      try {
        useTheme();
        return <div>Should not render</div>;
      } catch (error) {
        return <div>{error.message}</div>;
      }
    };

    render(<TestComponentWithoutProvider />);
    
    expect(screen.getByText('useTheme must be used within a ThemeProvider')).toBeInTheDocument();
  });
});