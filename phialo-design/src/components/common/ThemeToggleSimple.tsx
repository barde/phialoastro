import React, { useEffect, useState } from 'react';

interface ThemeToggleSimpleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggleSimple: React.FC<ThemeToggleSimpleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get initial theme from DOM
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Update DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    // Update state
    setTheme(newTheme);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`${sizeClasses[size]} ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative rounded-full border-2 border-theme-border
        bg-theme-surface hover:bg-theme-surface-hover
        text-theme-text-primary
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2
        hover:scale-105 active:scale-95
        group
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`
          ${iconSizeClasses[size]}
          absolute inset-0 m-auto
          transition-all duration-300 ease-in-out
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-75'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="5" strokeWidth="2" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`
          ${iconSizeClasses[size]}
          absolute inset-0 m-auto
          transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-75'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Floating particles effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-1 left-1 w-1 h-1 bg-gold rounded-full animate-pulse" />
        <div className="absolute top-2 right-1 w-1 h-1 bg-gold rounded-full animate-pulse delay-75" />
        <div className="absolute bottom-1 right-2 w-1 h-1 bg-gold rounded-full animate-pulse delay-150" />
        <div className="absolute bottom-2 left-1 w-1 h-1 bg-gold rounded-full animate-pulse delay-300" />
      </div>
    </button>
  );
};

export default ThemeToggleSimple;