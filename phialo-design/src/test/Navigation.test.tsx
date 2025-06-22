import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navigation from '../shared/navigation/Navigation';

describe('Navigation Component', () => {
  it('renders navigation links', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('3D für Sie')).toBeInTheDocument();
    expect(screen.getByText('Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
  });

  it('has correct href attributes', () => {
    render(<Navigation />);
    
    const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
    const servicesLink = screen.getByRole('link', { name: '3D für Sie' });
    const tutorialsLink = screen.getByRole('link', { name: 'Tutorials' });
    const contactLink = screen.getByRole('link', { name: 'Kontakt' });

    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
    expect(servicesLink).toHaveAttribute('href', '/services');
    expect(tutorialsLink).toHaveAttribute('href', '/tutorials');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  // Language selector is tested separately as it's part of Header component
});
