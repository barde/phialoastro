import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MobileMenu from '@/shared/navigation/MobileMenu';

describe('MobileMenu', () => {
  const mockOnClose = vi.fn();
  const navItems = [
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/services', label: '3D für Sie', labelEn: '3D for You' },
    { href: '/classes', label: 'Classes' },
    { href: '/about', label: 'Über mich', labelEn: 'About' },
    { href: '/contact', label: 'Kontakt', labelEn: 'Contact' }
  ];

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should have a solid white background when open', () => {
    render(
      <MobileMenu
        isOpen={true}
        onClose={mockOnClose}
        navItems={navItems}
        currentPath="/"
        isEnglish={false}
      />
    );

    const menuPanel = screen.getByTestId('mobile-menu-panel');
    expect(menuPanel).toBeInTheDocument();
    
    // Check that the menu panel has white background via inline styles
    expect(menuPanel).toHaveStyle({ 
      backgroundColor: 'rgb(255, 255, 255)',
      opacity: '1'
    });
  });

  it('should display "3D für Sie" with white background', () => {
    render(
      <MobileMenu
        isOpen={true}
        onClose={mockOnClose}
        navItems={navItems}
        currentPath="/"
        isEnglish={false}
      />
    );

    // Find the "3D für Sie" link
    const servicesLink = screen.getByText('3D für Sie');
    expect(servicesLink).toBeInTheDocument();
    
    // Get the nav container that contains this link
    const navContainer = servicesLink.closest('nav');
    expect(navContainer).toHaveClass('bg-white');
    
    // Verify the menu panel containing everything has white background
    const menuPanel = screen.getByTestId('mobile-menu-panel');
    expect(menuPanel).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('should display "3D for You" in English with white background', () => {
    render(
      <MobileMenu
        isOpen={true}
        onClose={mockOnClose}
        navItems={navItems}
        currentPath="/en/"
        isEnglish={true}
      />
    );

    // Find the "3D for You" link
    const servicesLink = screen.getByText('3D for You');
    expect(servicesLink).toBeInTheDocument();
    
    // Verify white background
    const menuPanel = screen.getByTestId('mobile-menu-panel');
    expect(menuPanel).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('should ensure all sections have white background', () => {
    const { container } = render(
      <MobileMenu
        isOpen={true}
        onClose={mockOnClose}
        navItems={navItems}
        currentPath="/"
        isEnglish={false}
      />
    );

    // Check header section
    const header = container.querySelector('.border-b');
    expect(header).toHaveClass('bg-white');

    // Check navigation section
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white');

    // Check CTA section
    const ctaSection = container.querySelector('.border-t');
    expect(ctaSection).toHaveClass('bg-white');
  });
});