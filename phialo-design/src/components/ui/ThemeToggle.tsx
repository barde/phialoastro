import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getThemeManager, type Theme } from '../../scripts/theme';

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const themeManager = getThemeManager();
    setCurrentTheme(themeManager.getTheme());

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });

    return unsubscribe;
  }, []);

  const handleToggle = () => {
    const themeManager = getThemeManager();
    themeManager.toggleTheme();
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full transition-colors duration-200"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Theme umschalten"
      >
        <Sun size={20} />
      </button>
    );
  }

  const isDark = currentTheme === 'dark' || 
    (currentTheme === 'system' && typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full transition-colors duration-200"
      style={{ 
        color: 'var(--color-text-secondary)',
        ':hover': { color: 'var(--color-text-primary)' }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
      aria-label={isDark ? 'Auf helles Design wechseln' : 'Auf dunkles Design wechseln'}
      title={isDark ? 'Hell' : 'Dunkel'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}