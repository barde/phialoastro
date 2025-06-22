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
      expect(screen.getByText('Über uns')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
    });

    it('should have correct hrefs for German pages', () => {
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D für Sie' });
      const tutorialsLink = screen.getByRole('link', { name: 'Tutorials' });
      const aboutLink = screen.getByRole('link', { name: 'Über uns' });
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
      expect(portfolioLink).toHaveClass('active');
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
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should have correct hrefs for English pages', () => {
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D for You' });
      const tutorialsLink = screen.getByRole('link', { name: 'Tutorials' });
      const aboutLink = screen.getByRole('link', { name: 'About Us' });
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
      expect(portfolioLink).toHaveClass('active');
    });
  });

  describe('Mobile Navigation', () => {
    it('should toggle mobile menu', async () => {
      const user = userEvent.setup();
      
      render(<Navigation />);

      // Mobile menu should be closed initially
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-expanded', 'false');

      // Click menu button
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);

      // Menu should be open
      expect(nav).toHaveAttribute('aria-expanded', 'true');

      // Click again to close
      await user.click(menuButton);
      expect(nav).toHaveAttribute('aria-expanded', 'false');
    });

    it('should close mobile menu when clicking a link', async () => {
      const user = userEvent.setup();
      
      render(<Navigation />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /menu/i });
      await user.click(menuButton);
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'true');

      // Click a navigation link
      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      await user.click(portfolioLink);

      // Menu should close
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have accessible menu button', () => {
      render(<Navigation />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

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
    it('should apply correct classes to navigation items', () => {
      render(<Navigation />);

      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        expect(link).toHaveClass('nav-link');
      });
    });

    it('should apply active class to current page', () => {
      window.location.pathname = '/portfolio';
      
      render(<Navigation />);

      const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
      const servicesLink = screen.getByRole('link', { name: '3D für Sie' });

      expect(portfolioLink).toHaveClass('active');
      expect(servicesLink).not.toHaveClass('active');
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