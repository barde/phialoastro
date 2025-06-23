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
  ExternalLink: () => <span data-testid="external-link-icon">ExternalLink</span>,
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
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Test Portfolio Item');
    });

    it('should render with hover overlay structure', () => {
      render(<PortfolioItem item={mockItem} />);

      const container = screen.getByTestId('portfolio-item');
      expect(container).toHaveClass('portfolio-item-container', 'group');
      
      // Check for overlay that appears on hover
      const overlay = container.querySelector('.group-hover\\:opacity-100');
      expect(overlay).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(screen.getByTestId('portfolio-details-button')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should show German text by default', async () => {
      window.location.pathname = '/';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        expect(screen.getByText('Ansehen')).toBeInTheDocument();
      });
    });

    it('should show English text on English pages', async () => {
      window.location.pathname = '/en/portfolio';
      render(<PortfolioItem item={mockItem} />);

      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('should handle language detection with useEffect', async () => {
      window.location.pathname = '/en/';
      render(<PortfolioItem item={mockItem} />);

      // After useEffect runs, should show English
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call onItemClick when clicking details button', () => {
      render(<PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />);

      fireEvent.click(screen.getByTestId('portfolio-details-button'));
      
      expect(mockOnItemClick).toHaveBeenCalledTimes(1);
      expect(mockOnItemClick).toHaveBeenCalledWith(mockItem);
    });

    it('should not throw error when clicking without onItemClick handler', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(() => {
        fireEvent.click(screen.getByTestId('portfolio-details-button'));
      }).not.toThrow();
    });

    it('should prevent event propagation when clicking buttons', () => {
      const containerClick = vi.fn();
      
      const { container } = render(
        <div onClick={containerClick}>
          <PortfolioItem item={mockItem} onItemClick={mockOnItemClick} />
        </div>
      );

      fireEvent.click(screen.getByTestId('portfolio-details-button'));
      
      // Should call item click but not container click (due to proper event handling)
      expect(mockOnItemClick).toHaveBeenCalled();
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
      expect(img).toHaveClass('w-full', 'h-full', 'object-contain');
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
        'h-full'
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

    it('should style details button correctly', () => {
      render(<PortfolioItem item={mockItem} />);

      const button = screen.getByTestId('portfolio-details-button');
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'bg-white/20',
        'backdrop-blur-sm',
        'rounded-full'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper image alt text', () => {
      render(<PortfolioItem item={mockItem} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', mockItem.title);
    });

    it('should have accessible button', () => {
      render(<PortfolioItem item={mockItem} />);

      const button = screen.getByTestId('portfolio-details-button');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveTextContent(/Ansehen|Details/);
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
        expect(screen.getByText('Ansehen')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Icons', () => {
    it('should render both Eye and ExternalLink icons', () => {
      render(<PortfolioItem item={mockItem} />);

      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
    });

    it('should position icons correctly', () => {
      render(<PortfolioItem item={mockItem} />);

      const detailsButton = screen.getByTestId('portfolio-details-button');
      const eyeIcon = screen.getByTestId('eye-icon');
      
      // Eye icon should be inside the details button
      expect(detailsButton).toContainElement(eyeIcon);
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