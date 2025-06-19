import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '../../../components/layout/LanguageSelector';

// Mock window and translation services
const mockWeglot = {
  Weglot: {
    initialize: vi.fn(),
    switchTo: vi.fn(),
  },
};

const mockGoogleTranslate = {
  google: {
    translate: {
      TranslateElement: vi.fn().mockImplementation(() => ({})),
    },
  },
};

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Mock window with both translation services
    vi.stubGlobal('window', {
      ...window,
      ...mockWeglot,
      ...mockGoogleTranslate,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders language selector with default DE selection', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);
    
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Italiano')).toBeInTheDocument();
    expect(screen.getByText('Nederlands')).toBeInTheDocument();
  });

  it('changes language when option is selected', () => {
    render(<LanguageSelector />);
    
    // Open dropdown
    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);
    
    // Click English option
    const englishOption = screen.getByText('English');
    fireEvent.click(englishOption);
    
    // Check if EN is now displayed
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(<LanguageSelector />);
    
    // Open dropdown
    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);
    
    // Verify dropdown is open
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    
    // Click outside (use a class selector instead of role)
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    // Dropdown should be closed
    expect(screen.queryByText('Deutsch')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Select language');
    expect(button).toHaveAttribute('aria-label', 'Select language');
  });
});