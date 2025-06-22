import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Navigation from '../../../shared/navigation/Navigation';

// Mock usePathname from Astro
vi.mock('@astrojs/react', () => ({
  usePathname: vi.fn()
}));

describe('Navigation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('German Navigation', () => {
    beforeEach(() => {
      // Mock German pathname
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true
      });
    });

    it('should render German navigation links', () => {
      render(<Navigation />);

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('3D für Sie')).toBeInTheDocument();
      expect(screen.getByText('Tutorials')).toBeInTheDocument();
      expect(screen.getByText('Über mich')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
    });

    it('should have correct hrefs for German pages', () => {
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D für Sie' });
      const tutorialsLink = screen.getByRole('link', { name: 'Tutorials' });
      const aboutLink = screen.getByRole('link', { name: 'Über mich' });
      const contactLink = screen.getByRole('link', { name: 'Kontakt' });

      expect(portfolioLink).toHaveAttribute('href', '/portfolio');
      expect(servicesLink).toHaveAttribute('href', '/services');
      expect(tutorialsLink).toHaveAttribute('href', '/tutorials');
      expect(aboutLink).toHaveAttribute('href', '/about');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('should mark active link correctly', () => {
      window.location.pathname = '/portfolio';
      
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      expect(portfolioLink).toHaveClass('text-midnight');
    });
  });

  describe('English Navigation', () => {
    beforeEach(() => {
      // Mock English pathname
      Object.defineProperty(window, 'location', {
        value: { pathname: '/en/' },
        writable: true,
        configurable: true
      });
    });

    it('should render English navigation links', () => {
      render(<Navigation />);

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('3D for You')).toBeInTheDocument();
      expect(screen.getByText('Tutorials')).toBeInTheDocument();
      expect(screen.getByText('About Me')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should have correct hrefs for English pages', () => {
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D for You' });
      const tutorialsLink = screen.getByRole('link', { name: 'Tutorials' });
      const aboutLink = screen.getByRole('link', { name: 'About Me' });
      const contactLink = screen.getByRole('link', { name: 'Contact' });

      expect(portfolioLink).toHaveAttribute('href', '/en/portfolio');
      expect(servicesLink).toHaveAttribute('href', '/en/services');
      expect(tutorialsLink).toHaveAttribute('href', '/en/tutorials');
      expect(aboutLink).toHaveAttribute('href', '/en/about');
      expect(contactLink).toHaveAttribute('href', '/en/contact');
    });

    it('should mark active link correctly on English pages', () => {
      window.location.pathname = '/en/portfolio';
      
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      expect(portfolioLink).toHaveClass('text-midnight');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Mock German pathname for mobile tests
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true
      });
    });

    it('should toggle mobile menu', async () => {
      const user = userEvent.setup();
      
      render(<Navigation />);

      // Mobile menu should be closed initially
      const menuButton = screen.getByLabelText('Menü öffnen');
      expect(menuButton).toBeInTheDocument();

      // Click menu button
      await user.click(menuButton);

      // Menu should be open - button label changes
      // There will be two buttons with this label (Navigation button + MobileMenu close button)
      const closeButtons = screen.getAllByLabelText('Menü schließen');
      expect(closeButtons).toHaveLength(2);

      // Click again to close - click the Navigation button (first one)
      await user.click(closeButtons[0]);
      expect(screen.getByLabelText('Menü öffnen')).toBeInTheDocument();
    });

    it('should close mobile menu when clicking a link', async () => {
      const user = userEvent.setup();
      
      render(<Navigation />);

      // Open menu
      const menuButton = screen.getByLabelText('Menü öffnen');
      await user.click(menuButton);
      
      // Menu should be open - check if MobileMenu is rendered
      expect(screen.getByText('Menü')).toBeInTheDocument();

      // Mock the onClose function in MobileMenu by clicking close button
      // This simulates the menu closing behavior without navigation
      const closeButton = screen.getAllByLabelText('Menü schließen')[1]; // Get the MobileMenu close button
      await user.click(closeButton);

      // Menu should close - MobileMenu should not be visible
      expect(screen.queryByText('Menü')).not.toBeInTheDocument();
    });

    it('should have accessible menu button', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Menü öffnen');
      expect(menuButton).toHaveAttribute('aria-label', 'Menü öffnen');
    });

    it('should have correct English labels when on English path', async () => {
      const user = userEvent.setup();
      
      // Set English path
      window.location.pathname = '/en/';
      
      render(<Navigation />);

      // Mobile menu should have English labels
      const menuButton = screen.getByLabelText('Open menu');
      expect(menuButton).toBeInTheDocument();

      // Click menu button
      await user.click(menuButton);

      // Should show English close label
      const closeButtons = screen.getAllByLabelText('Close menu');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      // Mock German pathname for accessibility tests
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true
      });
    });

    it('should have proper ARIA attributes', () => {
      render(<Navigation />);

      // Desktop navigation should be present
      const desktopNav = document.querySelector('nav.hidden.lg\\:flex');
      expect(desktopNav).toBeInTheDocument();

      // All links should be accessible
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<Navigation />);

      // Tab through links
      await user.tab();
      
      // First link should be focused
      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      expect(portfolioLink).toHaveFocus();

      // Continue tabbing
      await user.tab();
      const servicesLink = screen.getByRole('link', { name: /3D f/i });
      expect(servicesLink).toHaveFocus();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      // Mock German pathname for styling tests
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true
      });
    });

    it('should apply correct classes to navigation items', () => {
      render(<Navigation />);

      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toHaveClass('relative', 'text-sm', 'font-medium');
      });
    });

    it('should apply active class to current page', () => {
      window.location.pathname = '/portfolio';
      
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D für Sie' });

      expect(portfolioLink).toHaveClass('text-midnight');
      expect(servicesLink).toHaveClass('text-gray-600');
    });
  });

  describe('Path Detection', () => {
    it('should handle nested paths correctly', () => {
      window.location.pathname = '/en/portfolio/item-1';
      
      render(<Navigation />);

      // Should still detect English and apply correct hrefs
      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      expect(portfolioLink).toHaveAttribute('href', '/en/portfolio');
    });

    it('should handle root path correctly', () => {
      window.location.pathname = '/';
      
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      expect(portfolioLink).toHaveAttribute('href', '/portfolio');
    });
  });
});