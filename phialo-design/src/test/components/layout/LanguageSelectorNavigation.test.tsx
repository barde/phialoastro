import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSelector from '../../../components/layout/LanguageSelector';

describe('LanguageSelector Navigation', () => {
  let mockWeglot: any;
  let mockGoogleTranslate: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock Weglot
    mockWeglot = {
      initialize: vi.fn(),
      switchTo: vi.fn(),
      destroy: vi.fn(),
      initialized: false
    };
    
    // Mock Google Translate
    mockGoogleTranslate = {
      TranslateElement: vi.fn()
    };
    
    (window as any).Weglot = undefined;
    (window as any).google = undefined;
    
    // Mock document methods
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete (window as any).Weglot;
    delete (window as any).google;
    delete (window as any).googleTranslateElementInit;
  });

  it('should maintain translation state after navigation', async () => {
    const { rerender } = render(<LanguageSelector />);
    
    // Click on language selector to open dropdown
    const languageButton = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(languageButton);
    
    // Select English
    const englishOption = screen.getByText('EN');
    fireEvent.click(englishOption);
    
    // Verify language is stored
    expect(localStorage.getItem('preferred-language')).toBe('EN');
    
    // Simulate Astro navigation
    const navigationStartEvent = new Event('astro:before-swap');
    document.dispatchEvent(navigationStartEvent);
    
    // Simulate page load after navigation
    const pageLoadEvent = new Event('astro:page-load');
    document.dispatchEvent(pageLoadEvent);
    
    // Re-render component (simulating new page)
    rerender(<LanguageSelector />);
    
    // Verify language persists
    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });
  });

  it('should not reinitialize translation service if already active', async () => {
    // Set up Weglot as already initialized
    mockWeglot.initialized = true;
    (window as any).Weglot = mockWeglot;
    
    render(<LanguageSelector weglotApiKey="test-key" />);
    
    // Simulate navigation
    const pageLoadEvent = new Event('astro:page-load');
    document.dispatchEvent(pageLoadEvent);
    
    // Wait for any async operations
    await waitFor(() => {
      // Weglot should not be reinitialized
      expect(mockWeglot.initialize).not.toHaveBeenCalled();
    });
  });

  it('should handle navigation during translation initialization', async () => {
    render(<LanguageSelector />);
    
    // Simulate navigation start immediately
    const navigationStartEvent = new Event('astro:before-swap');
    document.dispatchEvent(navigationStartEvent);
    
    // Try to initialize during navigation
    const pageLoadEvent = new Event('astro:page-load');
    document.dispatchEvent(pageLoadEvent);
    
    // Should skip initialization during navigation
    await waitFor(() => {
      const scripts = document.querySelectorAll('script[src*="translate"]');
      expect(scripts.length).toBe(0);
    });
  });

  it('should reapply stored language after navigation with Weglot', async () => {
    // Store English preference
    localStorage.setItem('preferred-language', 'EN');
    
    // Set up Weglot
    (window as any).Weglot = mockWeglot;
    
    render(<LanguageSelector weglotApiKey="test-key" />);
    
    // Simulate successful Weglot initialization
    const script = document.querySelector('script[src*="weglot"]') as HTMLScriptElement;
    if (script && script.onload) {
      script.onload(new Event('load'));
    }
    
    // Wait for initialization
    await waitFor(() => {
      expect(mockWeglot.initialize).toHaveBeenCalled();
    });
    
    // Simulate navigation
    const pageLoadEvent = new Event('astro:page-load');
    document.dispatchEvent(pageLoadEvent);
    
    // Verify language is reapplied
    await waitFor(() => {
      expect(mockWeglot.switchTo).toHaveBeenCalledWith('en');
    }, { timeout: 1000 });
  });

  it('should reapply stored language after navigation with Google Translate', async () => {
    // Store English preference
    localStorage.setItem('preferred-language', 'EN');
    
    // Set up Google Translate
    (window as any).google = { translate: mockGoogleTranslate };
    
    render(<LanguageSelector />);
    
    // Create mock combo element
    const mockCombo = document.createElement('select');
    mockCombo.className = 'goog-te-combo';
    mockCombo.value = 'de';
    document.body.appendChild(mockCombo);
    
    // Mock dispatchEvent to track calls
    const dispatchEventSpy = vi.spyOn(mockCombo, 'dispatchEvent');
    
    // Simulate Google Translate initialization
    if ((window as any).googleTranslateElementInit) {
      (window as any).googleTranslateElementInit();
    }
    
    // Simulate navigation
    const pageLoadEvent = new Event('astro:page-load');
    document.dispatchEvent(pageLoadEvent);
    
    // Verify language is reapplied
    await waitFor(() => {
      expect(mockCombo.value).toBe('en');
      expect(dispatchEventSpy).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // Cleanup
    document.body.removeChild(mockCombo);
  });

  it('should handle rapid navigation events', async () => {
    render(<LanguageSelector />);
    
    // Simulate multiple rapid navigation events
    for (let i = 0; i < 5; i++) {
      const navigationStartEvent = new Event('astro:before-swap');
      document.dispatchEvent(navigationStartEvent);
      
      const pageLoadEvent = new Event('astro:page-load');
      document.dispatchEvent(pageLoadEvent);
    }
    
    // Should handle gracefully without errors
    await waitFor(() => {
      const scripts = document.querySelectorAll('script[src*="translate"]');
      expect(scripts.length).toBeLessThanOrEqual(1);
    });
  });
});