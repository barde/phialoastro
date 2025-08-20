import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioGrid from '../../../features/portfolio/components/OptimizedPortfolioGrid';
import type { PortfolioItemData } from '../../../features/portfolio/components/PortfolioSection';

// Mock framer-motion
vi.mock('../../../lib/framer-motion', () => ({
  motion: {
    div: ({ children, layout, ...props }: any) => {
      // Filter out non-DOM props
      const { variants, initial, animate, exit, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

// Mock MagneticCursor component
vi.mock('../../../shared/components/effects/MagneticCursor', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span>ExternalLink</span>,
  Eye: () => <span>Eye</span>,
}));

describe('PortfolioGrid', () => {
  beforeEach(() => {
    // Mock window.location for German (default)
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        href: 'http://localhost/'
      },
      configurable: true,
      writable: true
    });
  });

  const mockItems: PortfolioItemData[] = [
    {
      id: 1,
      title: 'Test Item 1',
      category: 'Category 1',
      image: '/images/test1.jpg',
      slug: 'test-item-1',
      description: 'Description 1',
      year: 2024,
      materials: ['Material 1'],
      techniques: ['Technique 1'],
      details: 'Details 1',
      gallery: []
    },
    {
      id: 2,
      title: 'Test Item 2',
      category: 'Category 2',
      image: '/images/test2.jpg',
      slug: 'test-item-2',
      description: 'Description 2',
      year: 2024,
      materials: ['Material 2'],
      techniques: ['Technique 2'],
      details: 'Details 2',
      gallery: []
    }
  ];

  it('renders all portfolio items', () => {
    render(<PortfolioGrid items={mockItems} />);

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('renders images for all items', () => {
    render(<PortfolioGrid items={mockItems} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockItems.length);
    expect(images[0]).toHaveAttribute('src', '/images/test1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Test Item 1 - Category 1');
    expect(images[1]).toHaveAttribute('src', '/images/test2.jpg');
    expect(images[1]).toHaveAttribute('alt', 'Test Item 2 - Category 2');
  });

  it('calls onItemClick when clicking a portfolio item', () => {
    const mockOnItemClick = vi.fn();
    render(<PortfolioGrid items={mockItems} onItemClick={mockOnItemClick} />);

    // Portfolio items are now clickable cards with test ID
    const portfolioItems = screen.getAllByTestId('portfolio-item');
    fireEvent.click(portfolioItems[0]);

    expect(mockOnItemClick).toHaveBeenCalledTimes(1);
    expect(mockOnItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('passes correct item data to onItemClick for each item', () => {
    const mockOnItemClick = vi.fn();
    render(<PortfolioGrid items={mockItems} onItemClick={mockOnItemClick} />);

    const portfolioItems = screen.getAllByTestId('portfolio-item');
    
    // Click first item
    fireEvent.click(portfolioItems[0]);
    expect(mockOnItemClick).toHaveBeenCalledWith(mockItems[0]);
    
    // Click second item
    fireEvent.click(portfolioItems[1]);
    expect(mockOnItemClick).toHaveBeenCalledWith(mockItems[1]);
    
    expect(mockOnItemClick).toHaveBeenCalledTimes(2);
  });

  it('renders without onItemClick prop', () => {
    render(<PortfolioGrid items={mockItems} />);
    
    const portfolioItems = screen.getAllByTestId('portfolio-item');
    
    // Should not throw error when clicking without handler
    expect(() => fireEvent.click(portfolioItems[0])).not.toThrow();
  });

  it('applies correct CSS classes for grid layout', () => {
    render(<PortfolioGrid items={mockItems} />);
    
    const grid = screen.getByText('Test Item 1').closest('.portfolio-grid');
    expect(grid).toBeInTheDocument();
    
    const items = grid?.querySelectorAll('.portfolio-item');
    expect(items).toHaveLength(mockItems.length);
  });

  it('renders empty grid when no items provided', () => {
    const { container } = render(<PortfolioGrid items={[]} />);
    
    const grid = container.querySelector('.portfolio-grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(0);
  });

  it('renders portfolio items with hover effects', () => {
    render(<PortfolioGrid items={mockItems} />);
    
    const portfolioItems = screen.getAllByTestId('portfolio-item');
    expect(portfolioItems[0]).toHaveClass('group');
    
    // Check for overlay that appears on hover
    const overlay = portfolioItems[0].querySelector('.group-hover\\:opacity-100');
    expect(overlay).toBeInTheDocument();
  });

  it('shows English text when on English path', () => {
    // Render with English language prop
    render(<PortfolioGrid items={mockItems} lang="en" />);

    // Check that items have English aria-labels
    const portfolioItems = screen.getAllByTestId('portfolio-item');
    expect(portfolioItems[0]).toHaveAttribute('aria-label', expect.stringContaining('Portfolio item'));
    expect(portfolioItems[0]).toHaveAttribute('aria-label', expect.stringContaining('Press Enter or Space'));
  });
});