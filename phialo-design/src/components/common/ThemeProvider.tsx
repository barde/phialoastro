import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check localStorage first
        const savedTheme = localStorage.getItem('phialo-theme') as Theme | null;
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeState(savedTheme);
        } else {
          // Fall back to system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme: Theme = prefersDark ? 'dark' : 'light';
          setThemeState(systemTheme);
          localStorage.setItem('phialo-theme', systemTheme);
        }
      } catch (error) {
        // Fallback to light theme if localStorage is not available
        console.warn('Could not access localStorage for theme preference:', error);
        setThemeState('light');
      }
      
      setIsInitialized(true);
    };

    initializeTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isInitialized) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark');
    
    // Add dark class if dark theme
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', theme);
    
    // Apply smooth transition for theme changes (but not on initial load)
    if (isInitialized) {
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      
      // Remove transition after animation completes
      const timeout = setTimeout(() => {
        root.style.transition = '';
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [theme, isInitialized]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('phialo-theme');
      if (!savedTheme) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        localStorage.setItem('phialo-theme', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('phialo-theme', newTheme);
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Don't render children until theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;