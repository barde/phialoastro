import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Portfolio from '../components/sections/Portfolio';

// Mock the content module
vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
}));

// Mock the framer-motion module
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  useInView: () => true,
}));

describe('Portfolio Component', () => {
  beforeEach(() => {
    // Mock portfolio data
    const mockPortfolioItems = [
      {
        id: 'test-item',
        slug: 'test-item',
        collection: 'portfolio',
        data: {
          title: 'Test Portfolio Item',
          description: 'Test description',
          image: '/images/test.jpg',
          category: 'Schmuck',
          materials: ['Silver', 'Gold'],
          year: 2024,
        },
      },
    ];

    const { getCollection } = require('astro:content');
    getCollection.mockResolvedValue(mockPortfolioItems);
  });

  it('renders portfolio section', () => {
    render(<Portfolio />);
    
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Einzigartige Kreationen')).toBeInTheDocument();
  });
});
