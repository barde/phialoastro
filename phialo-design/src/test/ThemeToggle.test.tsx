import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../components/ui/ThemeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('light');
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('displays moon icon for light theme', async () => {
    localStorageMock.getItem.mockReturnValue('light');
    render(<ThemeToggle />);
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Dunkel');
  });

  it('toggles theme when clicked', async () => {
    localStorageMock.getItem.mockReturnValue('light');
    render(<ThemeToggle />);
    
    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should have called localStorage.setItem to save the new theme
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});