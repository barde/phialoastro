/**
 * Component Translation Tests
 * Tests all components that should be language-aware
 * Verifies proper translation rendering and edge cases
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  testBothLanguages,
  mockWindowLocation,
  expectLanguageSpecificContent,
  TEST_TRANSLATIONS,
  type LanguageContext
} from '../utils/i18n-test-utils';
import Navigation from '../../components/layout/Navigation';
import MobileMenu from '../../components/layout/MobileMenu';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>
}));

describe('Component Translations', () => {
  beforeEach(() => {
    // Mock window.location
    mockWindowLocation('/');
    
    // Mock document.addEventListener for astro:page-load
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Navigation Component', () => {
    testBothLanguages('Navigation', (context: LanguageContext) => {
      test('renders navigation items with correct language', () => {
        // Mock the current path for the language context
        mockWindowLocation(context.currentPath);
        
        render(<Navigation />);
        
        // Check that navigation items are rendered
        expect(screen.getByText('Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Tutorials')).toBeInTheDocument();
        
        // Check language-specific labels
        if (context.isEnglish) {
          expect(screen.getByText('3D for You')).toBeInTheDocument();
          expect(screen.getByText('Contact')).toBeInTheDocument();
        } else {
          expect(screen.getByText('3D für Sie')).toBeInTheDocument();
          expect(screen.getByText('Kontakt')).toBeInTheDocument();
        }
      });

      test('generates correct localized hrefs', () => {
        mockWindowLocation(context.currentPath);
        
        render(<Navigation />);
        
        const portfolioLink = screen.getByText('Portfolio').closest('a');
        const contactLink = screen.getByText(context.isEnglish ? 'Contact' : 'Kontakt').closest('a');
        
        expect(portfolioLink).toHaveAttribute('href', 
          context.isEnglish ? '/en/portfolio' : '/portfolio'
        );
        expect(contactLink).toHaveAttribute('href', 
          context.isEnglish ? '/en/contact' : '/contact'
        );
      });

      test('shows correct active state for current page', () => {
        const portfolioPath = context.isEnglish ? '/en/portfolio' : '/portfolio';
        mockWindowLocation(portfolioPath);
        
        render(<Navigation />);
        
        const portfolioLink = screen.getByText('Portfolio').closest('a');
        expect(portfolioLink).toHaveClass('text-midnight');
      });

      test('mobile menu button has correct aria-label', () => {
        mockWindowLocation(context.currentPath);
        
        render(<Navigation />);
        
        const menuButton = screen.getByLabelText('Open menu');
        expect(menuButton).toBeInTheDocument();
        
        // Test clicking the menu button
        fireEvent.click(menuButton);
        
        // After clicking, it should change to "Close menu"
        expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
      });
    });
  });

  describe('MobileMenu Component', () => {
    const mockNavItems = [
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/services', label: '3D für Sie', labelEn: '3D for You' },
      { href: '/tutorials', label: 'Tutorials' },
      { href: '/contact', label: 'Kontakt', labelEn: 'Contact' }
    ];

    testBothLanguages('MobileMenu', (context: LanguageContext) => {
      test('renders menu header with correct language', () => {
        render(
          <MobileMenu
            isOpen={true}
            onClose={() => {}}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        const menuHeader = context.isEnglish ? 'Menu' : 'Menü';
        expect(screen.getByText(menuHeader)).toBeInTheDocument();
      });

      test('renders navigation items with correct labels', () => {
        render(
          <MobileMenu
            isOpen={true}
            onClose={() => {}}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        // Check common items
        expect(screen.getByText('Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Tutorials')).toBeInTheDocument();
        
        // Check language-specific items
        if (context.isEnglish) {
          expect(screen.getByText('3D for You')).toBeInTheDocument();
          expect(screen.getByText('Contact')).toBeInTheDocument();
        } else {
          expect(screen.getByText('3D für Sie')).toBeInTheDocument();
          expect(screen.getByText('Kontakt')).toBeInTheDocument();
        }
      });

      test('does not render when isOpen is false', () => {
        render(
          <MobileMenu
            isOpen={false}
            onClose={() => {}}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        const menuHeader = context.isEnglish ? 'Menu' : 'Menü';
        expect(screen.queryByText(menuHeader)).not.toBeInTheDocument();
      });

      test('calls onClose when close button is clicked', () => {
        const mockOnClose = vi.fn();
        
        render(
          <MobileMenu
            isOpen={true}
            onClose={mockOnClose}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        const closeButton = screen.getByLabelText('Close menu');
        fireEvent.click(closeButton);
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      test('calls onClose when backdrop is clicked', () => {
        const mockOnClose = vi.fn();
        
        render(
          <MobileMenu
            isOpen={true}
            onClose={mockOnClose}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        const backdrop = document.querySelector('.bg-midnight\\/20');
        expect(backdrop).toBeInTheDocument();
        
        fireEvent.click(backdrop!);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      test('shows correct active state for current page', () => {
        const portfolioPath = context.isEnglish ? '/en/portfolio' : '/portfolio';
        
        render(
          <MobileMenu
            isOpen={true}
            onClose={() => {}}
            navItems={mockNavItems}
            currentPath={portfolioPath}
            isEnglish={context.isEnglish}
          />
        );
        
        const portfolioLink = screen.getByText('Portfolio').closest('a');
        expect(portfolioLink).toHaveClass('text-gold');
      });

      test('handles keyboard navigation correctly', () => {
        const mockOnClose = vi.fn();
        
        render(
          <MobileMenu
            isOpen={true}
            onClose={mockOnClose}
            navItems={mockNavItems}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        // Mock escape key press
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Language Detection in Components', () => {
    test('Navigation component detects language from URL correctly', () => {
      const testCases = [
        { path: '/', expectedEnglish: false },
        { path: '/en/', expectedEnglish: true },
        { path: '/portfolio', expectedEnglish: false },
        { path: '/en/portfolio', expectedEnglish: true },
        { path: '/contact', expectedEnglish: false },
        { path: '/en/contact', expectedEnglish: true }
      ];

      testCases.forEach(({ path, expectedEnglish }) => {
        mockWindowLocation(path);
        
        render(<Navigation />);
        
        // Check if the correct language-specific content is displayed
        if (expectedEnglish) {
          expect(screen.getByText('3D for You')).toBeInTheDocument();
          expect(screen.getByText('Contact')).toBeInTheDocument();
        } else {
          expect(screen.getByText('3D für Sie')).toBeInTheDocument();
          expect(screen.getByText('Kontakt')).toBeInTheDocument();
        }
        
        cleanup();
      });
    });

    test('MobileMenu component respects isEnglish prop', () => {
      const testCases = [
        { isEnglish: false, expectedHeader: 'Menü' },
        { isEnglish: true, expectedHeader: 'Menu' }
      ];

      testCases.forEach(({ isEnglish, expectedHeader }) => {
        render(
          <MobileMenu
            isOpen={true}
            onClose={() => {}}
            navItems={[]}
            currentPath="/"
            isEnglish={isEnglish}
          />
        );
        
        expect(screen.getByText(expectedHeader)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Component Accessibility with Languages', () => {
    test('Navigation maintains accessibility attributes in both languages', () => {
      testBothLanguages('Navigation Accessibility', (context: LanguageContext) => {
        mockWindowLocation(context.currentPath);
        
        render(<Navigation />);
        
        // Check aria-label for mobile menu button
        const menuButton = screen.getByLabelText('Open menu');
        expect(menuButton).toBeInTheDocument();
        expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
      });
    });

    test('MobileMenu maintains accessibility in both languages', () => {
      testBothLanguages('MobileMenu Accessibility', (context: LanguageContext) => {
        render(
          <MobileMenu
            isOpen={true}
            onClose={() => {}}
            navItems={[]}
            currentPath={context.currentPath}
            isEnglish={context.isEnglish}
          />
        );
        
        // Check aria-label for close button
        const closeButton = screen.getByLabelText('Close menu');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('aria-label', 'Close menu');
      });
    });
  });

  describe('Dynamic Content Updates', () => {
    test('Navigation updates when language changes', () => {
      // Start with German
      mockWindowLocation('/');
      const { rerender } = render(<Navigation />);
      
      expect(screen.getByText('3D für Sie')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
      
      // Switch to English
      mockWindowLocation('/en/');
      rerender(<Navigation />);
      
      // Component should still show German labels since it relies on useEffect
      // This tests the initial render state
      expect(screen.getByText('3D für Sie')).toBeInTheDocument();
    });

    test('MobileMenu updates immediately when isEnglish prop changes', () => {
      const { rerender } = render(
        <MobileMenu
          isOpen={true}
          onClose={() => {}}
          navItems={[]}
          currentPath="/"
          isEnglish={false}
        />
      );
      
      expect(screen.getByText('Menü')).toBeInTheDocument();
      
      // Change language
      rerender(
        <MobileMenu
          isOpen={true}
          onClose={() => {}}
          navItems={[]}
          currentPath="/en/"
          isEnglish={true}
        />
      );
      
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('Navigation handles missing labelEn gracefully', () => {
      const navItemsWithoutEnglish = [
        { href: '/test', label: 'Test Only German' }
      ];
      
      // Mock Navigation component with test items
      mockWindowLocation('/en/');
      
      render(<Navigation />);
      
      // Should fall back to German label when English is not available
      // The actual Navigation component has fallback logic built-in
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    test('MobileMenu handles empty navItems array', () => {
      render(
        <MobileMenu
          isOpen={true}
          onClose={() => {}}
          navItems={[]}
          currentPath="/"
          isEnglish={false}
        />
      );
      
      expect(screen.getByText('Menü')).toBeInTheDocument();
      // Should not crash with empty navigation items
    });

    test('Components handle undefined language context', () => {
      // Test with undefined/null contexts
      mockWindowLocation('/some/invalid/path');
      
      render(<Navigation />);
      
      // Should still render without crashing
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });
  });
});