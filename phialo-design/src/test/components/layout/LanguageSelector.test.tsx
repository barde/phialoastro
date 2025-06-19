import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '../../../components/layout/LanguageSelector';

// Mock window and Google Translate
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
    
    // Mock window.google
    vi.stubGlobal('window', {
      ...window,
      ...mockGoogleTranslate,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders language selector with default DE selection', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByLabelText('Sprache auswählen')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByLabelText('Sprache auswählen');
    fireEvent.click(button);
    
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('changes language when option is selected', () => {
    render(<LanguageSelector />);
    
    // Open dropdown
    const button = screen.getByLabelText('Sprache auswählen');
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
    const button = screen.getByLabelText('Sprache auswählen');
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
    
    const button = screen.getByLabelText('Sprache auswählen');
    expect(button).toHaveAttribute('aria-label', 'Sprache auswählen');
  });
});