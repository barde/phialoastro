import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PortfolioItem from '../../../features/portfolio/components/PortfolioItem';
import type { PortfolioItemData } from '../../../features/portfolio/components/PortfolioSection';

// Mock MagneticCursor
vi.mock('../../../shared/components/effects/MagneticCursor', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">Eye</span>,
}));

describe('PortfolioItem', () => {
  const mockItem: PortfolioItemData = {
    id: 1,
    title: 'Test Portfolio Item',
    category: 'Test Category',
    image: '/images/test-item.jpg',
    slug: 'test-portfolio-item',
    description: 'Test description',
    year: 2024,
    materials: ['Material 1'],
    techniques: ['Technique 1'],
    details: 'Test details',
    gallery: [],
  };

  const originalLocation = window.location;
  let mockOnItemClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnItemClick = vi.fn();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render portfolio item with all basic elements', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(screen.getByTestId('portfolio-item')).toBeInTheDocument();
      expect(screen.getByText('Test Portfolio Item')).toBeInTheDocument();
      expect(screen.getByText('Test Category')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', '/images/test-item.jpg');
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Test Portfolio Item - Test Category');
    });

    it('should render with hover overlay structure', () => {
      render(<PortfolioItem item={mockItem} />);

      const container = screen.getByTestId('portfolio-item');
      expect(container).toHaveClass('portfolio-item-container', 'group');
      
      // Check for overlay that appears on hover
      const overlay = container.querySelector('.group-hover\\:opacity-100');
      expect(overlay).toBeInTheDocument();
    });

    it('should render clickable card with visual indicator', () => {
      render(<PortfolioItem item={mockItem} />);

      const card = screen.getByTestId('portfolio-item');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should show German text by default', async () => {
      window.location.pathname = '/';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        expect(screen.getByText('Details ansehen')).toBeInTheDocument();
      });
    });

    it('should show English text on English pages', async () => {
      window.location.pathname = '/en/portfolio';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument();
      });
    });

    it('should handle language detection with useEffect', async () => {
      window.location.pathname = '/en/';
      render(<PortfolioItem item={mockItem} />);

      // After useEffect runs, should show English
      await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call onItemClick when clicking the card', () => {
      render(<PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />);

      fireEvent.click(screen.getByTestId('portfolio-item'));
      
      expect(mockOnItemClick).toHaveBeenCalledTimes(1);
      expect(mockOnItemClick).toHaveBeenCalledWith(mockItem);
    });

    it('should call onItemClick when pressing Enter key', () => {
      render(<PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />);

      fireEvent.keyDown(screen.getByTestId('portfolio-item'), { key: 'Enter' });
      
      expect(mockOnItemClick).toHaveBeenCalledTimes(1);
      expect(mockOnItemClick).toHaveBeenCalledWith(mockItem);
    });

    it('should call onItemClick when pressing Space key', () => {
      render(<PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />);

      fireEvent.keyDown(screen.getByTestId('portfolio-item'), { key: ' ' });
      
      expect(mockOnItemClick).toHaveBeenCalledTimes(1);
      expect(mockOnItemClick).toHaveBeenCalledWith(mockItem);
    });

    it('should not throw error when clicking without onItemClick handler', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('portfolio-item'));
      }).not.toThrow();
    });

    it('should not call onItemClick for other keys', () => {
      render(<PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />);

      fireEvent.keyDown(screen.getByTestId('portfolio-item'), { key: 'Tab' });
      
      expect(mockOnItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Image Handling', () => {
    it('should render image with lazy loading', () => {
      render(<PortfolioItem item={mockItem} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should apply proper image styling classes', () => {
      render(<PortfolioItem item={mockItem} />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('w-full', 'h-full', 'object-cover');
    });

    it('should apply hover scale effect', () => {
      render(<PortfolioItem item={mockItem} />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('group-hover:scale-105');
    });
  });

  describe('Styling', () => {
    it('should have proper container styling', () => {
      render(<PortfolioItem item={mockItem} />);

      const container = screen.getByTestId('portfolio-item');
      expect(container).toHaveClass(
        'portfolio-item-container',
        'group',
        'relative',
        'overflow-hidden',
        'rounded-lg',
        'bg-gray-100',
        'aspect-[4/5]'
      );
    });

    it('should have proper overlay styling', () => {
      render(<PortfolioItem item={mockItem} />);

      const overlay = screen.getByTestId('portfolio-item').querySelector('.absolute.inset-0');
      expect(overlay).toHaveClass(
        'bg-gradient-to-t',
        'from-midnight/80',
        'opacity-0',
        'group-hover:opacity-100'
      );
    });

    it('should have proper focus styles', () => {
      render(<PortfolioItem item={mockItem} />);

      const card = screen.getByTestId('portfolio-item');
      expect(card).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-gold',
        'focus:ring-offset-2'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper image alt text', () => {
      render(<PortfolioItem item={mockItem} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test Portfolio Item - Test Category');
    });

    it('should have accessible card with proper ARIA attributes', () => {
      render(<PortfolioItem item={mockItem} />);

      const card = screen.getByTestId('portfolio-item');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-label');
    });

    it('should have proper aria-label in German', async () => {
      window.location.pathname = '/';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        const card = screen.getByTestId('portfolio-item');
        expect(card).toHaveAttribute('aria-label', expect.stringContaining('Portfolio-Element'));
      });
    });

    it('should have proper aria-label in English', async () => {
      window.location.pathname = '/en/';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        const card = screen.getByTestId('portfolio-item');
        expect(card).toHaveAttribute('aria-label', expect.stringContaining('Portfolio item'));
      });
    });
  });

  describe('MagneticCursor Integration', () => {
    it('should wrap content in MagneticCursor component', () => {
      const { container } = render(<PortfolioItem item={mockItem} />);

      // Since we mocked MagneticCursor as a simple div wrapper,
      // we can verify the structure is maintained
      expect(container.querySelector('.portfolio-item-container')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with special characters in title', () => {
      const specialItem = {
        ...mockItem,
        title: 'Test & Item "with" <special> characters',
      };

      render(<PortfolioItem item={specialItem} />);

      expect(screen.getByText('Test & Item "with" <special> characters')).toBeInTheDocument();
    });

    it('should handle items with long titles', () => {
      const longTitleItem = {
        ...mockItem,
        title: 'This is a very long title that might cause layout issues if not handled properly in the component',
      };

      render(<PortfolioItem item={longTitleItem} />);

      expect(screen.getByText(longTitleItem.title)).toBeInTheDocument();
    });

    it('should handle empty pathname', async () => {
      window.location.pathname = '';
      render(<PortfolioItem item={mockItem} />);

      // Should default to German when pathname is empty
      await waitFor(() => {
        expect(screen.getByText('Details ansehen')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Indicators', () => {
    it('should render Eye icon as visual indicator', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should show view details text with icon', async () => {
      window.location.pathname = '/';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        expect(screen.getByText('Details ansehen')).toBeInTheDocument();
      });
    });
  });

  describe('Typography', () => {
    it('should use correct font classes for title', () => {
      render(<PortfolioItem item={mockItem} />);

      const title = screen.getByText(mockItem.title);
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('font-display', 'text-xl', 'font-medium');
    });

    it('should style category text correctly', () => {
      render(<PortfolioItem item={mockItem} />);

      const category = screen.getByText(mockItem.category);
      expect(category.tagName).toBe('P');
      expect(category).toHaveClass('text-sm', 'text-white/80');
    });
  });
});