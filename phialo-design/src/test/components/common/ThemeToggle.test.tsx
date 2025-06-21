import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ThemeToggle from '../../../components/common/ThemeToggle';
import ThemeProvider from '../../../components/common/ThemeProvider';

describe('ThemeToggle', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    );
  };

  it('should render theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /mode/i });
    expect(button).toBeInTheDocument();
  });

  it('should have correct aria-label for light mode', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Initially in light mode
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Click to switch to dark mode
    await user.click(button);
    
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    
    // Click to switch back to light mode
    await user.click(button);
    
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('should render with different sizes', () => {
    const { rerender } = renderWithTheme(<ThemeToggle size="sm" />);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('w-8', 'h-8');
    
    rerender(
      <ThemeProvider>
        <ThemeToggle size="md" />
      </ThemeProvider>
    );
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('w-10', 'h-10');
    
    rerender(
      <ThemeProvider>
        <ThemeToggle size="lg" />
      </ThemeProvider>
    );
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('w-12', 'h-12');
  });

  it('should accept custom className', () => {
    renderWithTheme(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should show sun icon in light mode', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    const svgs = button.querySelectorAll('svg');
    
    expect(svgs).toHaveLength(2); // Both sun and moon icons
    
    // Sun icon should be visible (opacity-100)
    expect(svgs[0]).toHaveClass('opacity-100');
    // Moon icon should be hidden (opacity-0)
    expect(svgs[1]).toHaveClass('opacity-0');
  });

  it('should show moon icon in dark mode', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Switch to dark mode
    await user.click(button);
    
    const svgs = button.querySelectorAll('svg');
    
    // Sun icon should be hidden (opacity-0)
    expect(svgs[0]).toHaveClass('opacity-0');
    // Moon icon should be visible (opacity-100)
    expect(svgs[1]).toHaveClass('opacity-100');
  });

  it('should have hover effects', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Check hover classes are applied
    expect(button).toHaveClass('hover:scale-105');
    expect(button).toHaveClass('hover:bg-theme-surface-hover');
    
    // Hover over button
    await user.hover(button);
    
    // Check floating particles are shown on hover
    const particles = button.querySelector('.group-hover\\:opacity-100');
    expect(particles).toBeInTheDocument();
  });

  it('should have focus styles', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Focus button using keyboard
    await user.tab();
    
    expect(button).toHaveFocus();
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-gold');
  });

  it('should have active scale effect', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:scale-95');
  });
});