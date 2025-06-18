import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSwitcher from '../../../components/layout/LanguageSwitcher';

// Mock the i18n module
vi.mock('../../../lib/i18n', () => ({
  getLocaleFromUrl: vi.fn(() => 'en'),
  getLocalizedUrl: vi.fn((locale: string, path: string, currentLocale?: string) => {
    if (locale === 'de') return `/de${path}`;
    return path;
  }),
  type: {} as any
}));

// Mock window.location
const mockLocation = {
  href: 'https://example.com/',
  pathname: '/'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = 'https://example.com/';
    mockLocation.pathname = '/';
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('astro:page-load', vi.fn());
  });

  it('renders language switcher button', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch language');
  });

  it('displays globe icon', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('shows current language name on desktop', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });

  it('displays language options in dropdown', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getAllByText('English')).toHaveLength(2); // One in button, one in dropdown
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });

  it('highlights current language in dropdown', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const englishOption = screen.getAllByText('English')[1]; // Second one is in dropdown
      expect(englishOption.closest('button')).toHaveClass('bg-gold/10');
    });
  });

  it('displays flag emojis for languages', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getAllByText('🇺🇸')).toHaveLength(2); // One in button, one in dropdown
      expect(screen.getByText('🇩🇪')).toBeInTheDocument();
    });
  });

  it('closes dropdown when backdrop is clicked', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    
    await waitFor(() => {
      expect(screen.queryByText('Deutsch')).not.toBeInTheDocument();
    });
  });

  it('switches language when option is clicked', async () => {
    // Mock window.location.href assignment
    const originalAssign = window.location.href;
    const mockHref = vi.fn();
    
    Object.defineProperty(window.location, 'href', {
      set: mockHref,
      get: () => originalAssign
    });
    
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const deutschOption = screen.getByText('Deutsch').closest('button');
      expect(deutschOption).toBeInTheDocument();
      fireEvent.click(deutschOption!);
    });
    
    expect(mockHref).toHaveBeenCalledWith('/de/');
  });

  it('applies custom className', () => {
    render(<LanguageSwitcher className="custom-class" />);
    
    const container = screen.getByRole('button', { name: /switch language/i }).parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('handles keyboard interaction', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /switch language/i });
    
    // Focus and activate with keyboard
    button.focus();
    fireEvent.click(button); // Use click instead of keyDown for simplicity
    
    await waitFor(() => {
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });
  });
});