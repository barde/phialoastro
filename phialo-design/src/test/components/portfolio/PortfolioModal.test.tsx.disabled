import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PortfolioModal from '../../../features/portfolio/components/PortfolioModal';
import type { PortfolioItemData } from '../../../features/portfolio/components/PortfolioSection';

// Mock framer-motion
vi.mock('../../../lib/framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  ChevronLeft: () => <span data-testid="chevron-left">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
}));

describe('PortfolioModal', () => {
  const mockPortfolioItem: PortfolioItemData = {
    id: 1,
    title: 'Test Item',
    category: 'Ringe',
    image: '/images/test.jpg',
    slug: 'test-item',
    description: 'Test description',
    year: 2024,
    materials: ['Gold', 'Silver'],
    techniques: ['3D Modeling', 'Casting'],
    details: 'Detailed information',
    gallery: ['/images/test1.jpg', '/images/test2.jpg', '/images/test3.jpg'],
    client: 'Test Client',
    projectDate: '2024',
    availability: 'available',
    price: '€1,500',
    tags: ['luxury', 'handmade'],
  };

  const originalLocation = window.location;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { ...originalLocation };
    
    // Mock document methods
    document.body.style.overflow = '';
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <PortfolioModal
          isOpen={false}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.queryByTestId('portfolio-modal')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.getByTestId('portfolio-modal')).toBeInTheDocument();
    });

    it('should render all portfolio item details', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('€1,500')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should display German text by default', async () => {
      window.location.pathname = '/';
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Materialien')).toBeInTheDocument();
        expect(screen.getByText('Kunde')).toBeInTheDocument();
        expect(screen.getByText('Projektdatum')).toBeInTheDocument();
        expect(screen.getByText('Verfügbarkeit')).toBeInTheDocument();
        expect(screen.getByText('Preis')).toBeInTheDocument();
      });
    });

    it('should display English text on English pages', async () => {
      window.location.pathname = '/en/portfolio';
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
          lang="en"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Materials')).toBeInTheDocument();
        expect(screen.getByText('Client')).toBeInTheDocument();
        expect(screen.getByText('Project Date')).toBeInTheDocument();
        expect(screen.getByText('Availability')).toBeInTheDocument();
        expect(screen.getByText('Price')).toBeInTheDocument();
      });
    });

    it('should translate category names for English', async () => {
      window.location.pathname = '/en/';
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
          lang="en"
        />
      );

      await waitFor(() => {
        // Should translate "Ringe" to "Rings"
        expect(screen.getByText('Rings')).toBeInTheDocument();
      });
    });

    it('should translate availability status', async () => {
      window.location.pathname = '/en/';
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
          lang="en"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
      });
    });
  });

  describe('Gallery Navigation', () => {
    it('should show navigation buttons when multiple images exist', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.getByLabelText(/Vorheriges Bild/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nächstes Bild/)).toBeInTheDocument();
    });

    it('should not show navigation for single image', () => {
      const singleImageItem = { ...mockPortfolioItem, gallery: [] };
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={singleImageItem}
        />
      );

      expect(screen.queryByLabelText(/Vorheriges Bild/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Nächstes Bild/)).not.toBeInTheDocument();
    });

    it('should navigate to next image when clicking next button', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const nextButton = screen.getByLabelText(/Nächstes Bild/);
      const images = screen.getAllByRole('img');
      
      expect(images[0]).toHaveAttribute('src', '/images/test1.jpg');
      
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const updatedImages = screen.getAllByRole('img');
        expect(updatedImages[0]).toHaveAttribute('src', '/images/test2.jpg');
      });
    });

    it('should navigate to previous image when clicking previous button', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const prevButton = screen.getByLabelText(/Vorheriges Bild/);
      
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        // Should go to last image (circular navigation)
        expect(images[0]).toHaveAttribute('src', '/images/test3.jpg');
      });
    });

    it('should show image indicators', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Should have 3 indicator buttons
      const indicators = screen.getAllByLabelText(/Zu Bild/);
      expect(indicators).toHaveLength(3);
    });

    it('should navigate to specific image when clicking indicator', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const indicators = screen.getAllByLabelText(/Zu Bild/);
      fireEvent.click(indicators[2]); // Click third indicator
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', '/images/test3.jpg');
      });
    });
  });

  describe('Closing Behavior', () => {
    it('should call onClose when clicking close button', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      fireEvent.click(screen.getByTestId('modal-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking overlay', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Click on the overlay (the outer container)
      const modal = screen.getByTestId('portfolio-modal').parentElement;
      if (modal) {
        fireEvent.click(modal);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not close when clicking modal content', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      fireEvent.click(screen.getByTestId('portfolio-modal'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should navigate images with arrow keys', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Press right arrow
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', '/images/test2.jpg');
      });

      // Press left arrow
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('src', '/images/test1.jpg');
      });
    });

    it('should not navigate with arrow keys for single image', () => {
      const singleImageItem = { ...mockPortfolioItem, gallery: [] };
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={singleImageItem}
        />
      );

      const initialSrc = screen.getByRole('img').getAttribute('src');
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      // Image should not change
      expect(screen.getByRole('img')).toHaveAttribute('src', initialSrc);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have accessible close button', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const closeButton = screen.getByTestId('modal-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Modal schließen');
    });

    it('should have accessible navigation buttons', async () => {
      window.location.pathname = '/en/';
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
          lang="en"
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
        expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      });
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when open', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <PortfolioModal
          isOpen={false}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Image Loading', () => {
    it('should show loading state initially', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Look for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should handle image load errors', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const img = screen.getByRole('img');
      
      // Simulate error
      fireEvent.error(img);
      
      // Should set fallback image
      expect(img).toHaveAttribute('src', '/images/placeholder.svg');
      expect(img).toHaveAttribute('alt', 'Image not available');
    });
  });

  describe('Edge Cases', () => {
    it('should handle items without optional fields', () => {
      const minimalItem: PortfolioItemData = {
        ...mockPortfolioItem,
        materials: [],
        client: undefined,
        projectDate: undefined,
        availability: undefined,
        price: undefined,
        tags: [],
      };

      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={minimalItem}
        />
      );

      // Should not show sections for missing data
      expect(screen.queryByText('Materialien')).not.toBeInTheDocument();
      expect(screen.queryByText('Kunde')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should handle undefined window location pathname', async () => {
      Object.defineProperty(window.location, 'pathname', {
        value: undefined,
        writable: true,
      });

      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Should default to German
      await waitFor(() => {
        expect(screen.getByText('Materialien')).toBeInTheDocument();
      });
    });
  });
});