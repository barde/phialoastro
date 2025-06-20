import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Reset mock storage
    mockLocalStorage.clear();
    
    // Mock localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);
    
    // Mock window with translation services
    vi.stubGlobal('window', {
      ...window,
      ...mockWeglot,
      ...mockGoogleTranslate,
    });
    
    // Create the required elements for translation services
    const weglotSwitcher = document.createElement('div');
    weglotSwitcher.id = 'weglot-switcher';
    document.body.appendChild(weglotSwitcher);
    
    const googleTranslateElement = document.createElement('div');
    googleTranslateElement.id = 'google-translate-element';
    document.body.appendChild(googleTranslateElement);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
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
    
    // Verify localStorage is updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('preferred-language', 'EN');
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
  
  it('loads saved language preference from localStorage', () => {
    // Set a stored language preference
    mockLocalStorage.setItem('preferred-language', 'EN');
    
    // Render component
    render(<LanguageSelector />);
    
    // Should display the stored preference
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
  
  it('reinitializes translation after page navigation', () => {
    // Set a stored language preference
    mockLocalStorage.setItem('preferred-language', 'EN');
    
    // Render component
    const { unmount, rerender } = render(<LanguageSelector weglotApiKey="test-key" />);
    
    // Create mock Google translate combo
    const mockCombo = document.createElement('select');
    mockCombo.className = 'goog-te-combo';
    document.body.appendChild(mockCombo);
    
    // Simulate Astro page transition
    act(() => {
      // Create and dispatch page load event
      const pageLoadEvent = new Event('astro:page-load');
      document.dispatchEvent(pageLoadEvent);
    });
    
    // Weglot should be initialized
    expect(mockWeglot.Weglot.initialize).toHaveBeenCalledTimes(1);
    
    // Should still display the stored preference
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
  
  it('handles Weglot service correctly', () => {
    render(<LanguageSelector weglotApiKey="test-key" />);
    
    // Open dropdown and select language
    fireEvent.click(screen.getByLabelText('Select language'));
    fireEvent.click(screen.getByText('English'));
    
    // Should call Weglot.switchTo with correct locale
    expect(mockWeglot.Weglot.switchTo).toHaveBeenCalledWith('en');
  });
  
  it('handles Google Translate service correctly', () => {
    // Remove Weglot to force Google Translate usage
    const windowWithoutWeglot = { ...window, ...mockGoogleTranslate };
    vi.stubGlobal('window', windowWithoutWeglot);
    
    render(<LanguageSelector />);
    
    // Create mock Google translate combo
    const mockCombo = document.createElement('select');
    mockCombo.className = 'goog-te-combo';
    document.body.appendChild(mockCombo);
    
    // Spy on dispatchEvent
    const dispatchSpy = vi.spyOn(mockCombo, 'dispatchEvent');
    
    // Open dropdown and select language
    fireEvent.click(screen.getByLabelText('Select language'));
    fireEvent.click(screen.getByText('English'));
    
    // Should try to change Google Translate combo
    expect(dispatchSpy).toHaveBeenCalled();
  });
});