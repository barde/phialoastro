import React from 'react';
import ThemeProvider from './ThemeProvider';
import ThemeToggle from './ThemeToggle';

interface ThemeToggleWrapperProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ThemeToggleWrapper: React.FC<ThemeToggleWrapperProps> = ({ size, className }) => {
  return (
    <ThemeProvider>
      <ThemeToggle size={size} className={className} />
    </ThemeProvider>
  );
};

export default ThemeToggleWrapper;