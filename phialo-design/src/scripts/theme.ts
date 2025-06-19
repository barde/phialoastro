// Theme management with localStorage persistence
export type Theme = 'light' | 'dark' | 'system';

export class ThemeManager {
  private currentTheme: Theme = 'light';
  private callbacks: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.initializeTheme();
    this.setupSystemListener();
  }

  private initializeTheme() {
    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // Get saved theme from localStorage or default to 'light'
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
    this.setTheme(savedTheme, false);
  }

  private setupSystemListener() {
    // Listen for system theme changes when theme is set to 'system'
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === 'system') {
          this.applyTheme();
        }
      });
    }
  }

  private applyTheme() {
    // Only apply theme if we're in a browser environment
    if (typeof document === 'undefined') {
      return;
    }
    
    const html = document.documentElement;
    
    if (this.currentTheme === 'system') {
      // Remove data-theme to let CSS fallback to system preference
      html.removeAttribute('data-theme');
    } else {
      // Set explicit theme
      html.setAttribute('data-theme', this.currentTheme);
    }
    
    // Also update the meta theme-color for mobile browsers
    this.updateMetaThemeColor();
  }

  private updateMetaThemeColor() {
    // Only update meta theme color if we're in a browser environment
    if (typeof document === 'undefined') {
      return;
    }
    
    const isDark = this.getEffectiveTheme() === 'dark';
    const themeColor = isDark ? '#0A192F' : '#FFFFFF';
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);
  }

  public setTheme(theme: Theme, persist: boolean = true) {
    this.currentTheme = theme;
    
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    
    this.applyTheme();
    this.notifyCallbacks();
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      // Default to light if we can't detect system preference
      return 'light';
    }
    return this.currentTheme;
  }

  public toggleTheme() {
    const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  public subscribe(callback: (theme: Theme) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.currentTheme));
  }
}

// Global theme manager instance
let themeManager: ThemeManager;

export function getThemeManager(): ThemeManager {
  if (!themeManager) {
    themeManager = new ThemeManager();
  }
  return themeManager;
}

// Initialize theme immediately on script load to prevent flash
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  getThemeManager();
}