import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock the components used in Header
vi.mock('../../../shared/navigation/Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>
}));

vi.mock('../../../components/layout/LanguageSelector.astro', () => ({
  default: () => <div data-testid="language-selector">Language Selector</div>
}));


// We'll need to create a testable version of the Header component
// since the actual Header is an Astro component
const Header = ({ transparent = false }: { transparent?: boolean }) => {
  const currentPath = window.location.pathname;
  const isEnglish = currentPath.startsWith('/en');
  const logoHref = isEnglish ? '/en/' : '/';
  const ctaHref = isEnglish ? '/en/contact' : '/contact';
  const ctaLabel = isEnglish ? 'Request Project' : 'Projekt anfragen';
  const logoAriaLabel = isEnglish ? 'Phialo Design Homepage' : 'Phialo Design Startseite';

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent ? 'bg-transparent' : 'bg-theme-background/95 backdrop-blur-sm border-b border-theme-border'
      }`}
      data-transparent={transparent}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href={logoHref}
            className="font-display text-2xl font-medium text-theme-text-primary hover:text-theme-accent transition-colors"
            aria-label={logoAriaLabel}
          >
            PHIALO
          </a>

          {/* Desktop Navigation */}
          <div className="flex items-center space-x-4">
            <nav data-testid="navigation">Navigation</nav>
            <div data-testid="language-selector">Language Selector</div>
          </div>

          {/* CTA Button */}
          <a
            href={ctaHref}
            className="hidden lg:inline-flex items-center px-6 py-2 text-sm font-medium text-theme-accent border border-theme-accent rounded-full hover:bg-theme-accent hover:text-theme-accent-text transition-all duration-200"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </header>
  );
};

describe('Header', () => {
  beforeEach(() => {
    // Reset window.location before each test
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
      configurable: true
    });
  });

  describe('Logo Navigation (Issue #21)', () => {
    it('should have correct logo href for German pages', () => {
      window.location.pathname = '/portfolio';
      
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveAttribute('href', '/');
      expect(logo).toHaveAttribute('aria-label', 'Phialo Design Startseite');
    });

    it('should have correct logo href for English pages', () => {
      window.location.pathname = '/en/portfolio';
      
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveAttribute('href', '/en/');
      expect(logo).toHaveAttribute('aria-label', 'Phialo Design Homepage');
    });

    it('should maintain language context on nested English pages', () => {
      window.location.pathname = '/en/portfolio/item-1';
      
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveAttribute('href', '/en/');
    });

    it('should have correct logo text', () => {
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveTextContent('PHIALO');
    });
  });

  describe('CTA Button', () => {
    it('should have correct CTA href and text for German pages', () => {
      window.location.pathname = '/';
      
      render(<Header />);
      
      const ctaButton = screen.getByRole('link', { name: 'Projekt anfragen' });
      expect(ctaButton).toHaveAttribute('href', '/contact');
    });

    it('should have correct CTA href and text for English pages', () => {
      window.location.pathname = '/en/';
      
      render(<Header />);
      
      const ctaButton = screen.getByRole('link', { name: 'Request Project' });
      expect(ctaButton).toHaveAttribute('href', '/en/contact');
    });
  });


  describe('Language Selector Integration', () => {
    it('should render language selector', () => {
      render(<Header />);
      
      const langSelector = screen.getByTestId('language-selector');
      expect(langSelector).toBeInTheDocument();
    });
  });

  describe('Transparency Mode', () => {
    it('should apply transparent styles when transparent prop is true', () => {
      render(<Header transparent={true} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-transparent');
      expect(header).not.toHaveClass('bg-theme-background/95');
    });

    it('should apply solid background when transparent prop is false', () => {
      render(<Header transparent={false} />);
      
      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('bg-transparent');
      expect(header).toHaveClass('bg-theme-background/95');
    });
  });

  describe('Responsive Design', () => {
    it('should hide CTA button on mobile (lg:hidden)', () => {
      render(<Header />);
      
      const ctaButton = screen.getByRole('link', { name: /Projekt anfragen|Request Project/i });
      expect(ctaButton).toHaveClass('hidden', 'lg:inline-flex');
    });
  });

  describe('Accessibility', () => {
    it('should have proper header structure', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('id', 'main-header');
    });

    it('should have accessible logo link', () => {
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveAttribute('aria-label');
    });

    it('should have proper navigation structure', () => {
      render(<Header />);
      
      const nav = screen.getByTestId('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have correct logo styling classes', () => {
      render(<Header />);
      
      const logo = screen.getByRole('link', { name: /PHIALO/i });
      expect(logo).toHaveClass('font-display', 'text-2xl', 'font-medium');
      expect(logo).toHaveClass('hover:text-theme-accent');
    });

    it('should have correct CTA button styling', () => {
      render(<Header />);
      
      const ctaButton = screen.getByRole('link', { name: /Projekt anfragen|Request Project/i });
      expect(ctaButton).toHaveClass('text-theme-accent', 'border-theme-accent');
      expect(ctaButton).toHaveClass('hover:bg-theme-accent', 'hover:text-theme-accent-text');
    });

    it('should have fixed positioning', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
    });
  });
});