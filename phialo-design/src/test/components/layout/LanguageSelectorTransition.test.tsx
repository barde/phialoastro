import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LanguageSelector from '../../../components/layout/LanguageSelector';

// Mock window objects
const mockWeglot = {
  Weglot: {
    initialize: vi.fn(),
    switchTo: vi.fn(),
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

describe('LanguageSelector Astro Transitions', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Reset localStorage mock
    mockLocalStorage.clear();
    
    // Mock localStorage
    vi.stubGlobal('localStorage', mockLocalStorage);
    
    // Mock window with translation services
    vi.stubGlobal('window', {
      ...window,
      ...mockWeglot,
    });
    
    // Create the required elements for translation services
    const weglotSwitcher = document.createElement('div');
    weglotSwitcher.id = 'weglot-switcher';
    document.body.appendChild(weglotSwitcher);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('preserves language selection across page transitions', async () => {
    // Render with API key
    const { unmount } = render(<LanguageSelector weglotApiKey="test-api-key" />);
    
    // Select English
    fireEvent.click(screen.getByLabelText('Select language'));
    fireEvent.click(screen.getByText('English'));
    
    // Check that language was switched
    expect(mockWeglot.Weglot.switchTo).toHaveBeenCalledWith('en');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('preferred-language', 'EN');
    
    // Simulate page transition by unmounting and remounting
    unmount();
    
    // Reset some mocks for cleaner assertions
    vi.clearAllMocks();
    
    // Re-render component (like after navigation)
    render(<LanguageSelector weglotApiKey="test-api-key" />);
    
    // Check that EN is still selected
    expect(screen.getByText('EN')).toBeInTheDocument();
    
    // Simulate Astro navigation event
    act(() => {
      const pageLoadEvent = new Event('astro:page-load');
      document.dispatchEvent(pageLoadEvent);
    });
    
    // Wait for any async operations
    await vi.waitFor(() => {
      // Should have tried to re-initialize Weglot
      expect(mockWeglot.Weglot.initialize).toHaveBeenCalled();
    });
    
    // Check that the previously selected language is restored
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('handles errors during initialization gracefully', async () => {
    // Make Weglot.initialize throw an error
    mockWeglot.Weglot.initialize.mockImplementationOnce(() => {
      throw new Error('Initialization failed');
    });
    
    // Should not throw despite the error
    expect(() => render(<LanguageSelector weglotApiKey="test-api-key" />)).not.toThrow();
    
    // The component should still render
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
    
    // Should show the default language
    expect(screen.getByText('DE')).toBeInTheDocument();
  });
  
  it('reinitializes translation service after page transition', async () => {
    // Set initial language preference
    mockLocalStorage.setItem('preferred-language', 'EN');
    
    // Render component
    render(<LanguageSelector weglotApiKey="test-api-key" />);
    
    // Check initial state reflects stored preference
    expect(screen.getByText('EN')).toBeInTheDocument();
    
    // Clear mocks to better track calls after transition
    vi.clearAllMocks();
    
    // Simulate Astro page transition
    act(() => {
      const pageLoadEvent = new Event('astro:page-load');
      document.dispatchEvent(pageLoadEvent);
    });
    
    // Wait for async operations
    await vi.waitFor(() => {
      // Should have tried to re-initialize
      expect(mockWeglot.Weglot.initialize).toHaveBeenCalled();
      // Should have tried to restore language
      expect(mockWeglot.Weglot.switchTo).toHaveBeenCalledWith('en');
    });
  });
});
