import React from 'react';
import ThemeProvider from './ThemeProvider';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;