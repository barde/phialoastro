import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PortfolioModal from '../../../components/common/PortfolioModal';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span>Close</span>,
  ChevronLeft: () => <span>Previous</span>,
  ChevronRight: () => <span>Next</span>,
}));

describe('PortfolioModal', () => {
  const mockOnClose = vi.fn();
  const mockPortfolioItem = {
    title: 'Test Portfolio Item',
    description: 'Test description',
    category: 'Test Category',
    image: '/images/test.jpg',
    gallery: ['/images/test1.jpg', '/images/test2.jpg', '/images/test3.jpg'],
    materials: ['Silver', 'Gold'],
    client: 'Test Client',
    projectDate: 'January 2024',
    availability: 'available',
    price: '$1,000',
    tags: ['modern', 'minimal']
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.title)).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.description)).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <PortfolioModal
          isOpen={false}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays all portfolio item data correctly', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Check title and description
      expect(screen.getByText(mockPortfolioItem.title)).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.description)).toBeInTheDocument();
      
      // Check category badge
      expect(screen.getByText(mockPortfolioItem.category)).toBeInTheDocument();
      
      // Check materials
      mockPortfolioItem.materials.forEach(material => {
        expect(screen.getByText(material)).toBeInTheDocument();
      });
      
      // Check additional details
      expect(screen.getByText(mockPortfolioItem.client)).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.projectDate)).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.availability)).toBeInTheDocument();
      expect(screen.getByText(mockPortfolioItem.price)).toBeInTheDocument();
      
      // Check tags
      mockPortfolioItem.tags.forEach(tag => {
        expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
      });
    });

    it('renders with single image when no gallery is provided', () => {
      const singleImageItem = {
        ...mockPortfolioItem,
        gallery: undefined
      };

      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={singleImageItem}
        />
      );

      // Should not show navigation buttons
      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when clicking close button', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside the modal', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Click on the overlay (the parent div with onClick handler)
      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the modal content', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const modalTitle = screen.getByText(mockPortfolioItem.title);
      fireEvent.click(modalTitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when pressing ESC key', () => {
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
  });

  describe('Gallery Navigation', () => {
    it('navigates to next image when clicking next button', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const nextButton = screen.getByLabelText('Next image');
      const image = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
      
      expect(image.src).toContain('test1.jpg');
      
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const updatedImage = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
        expect(updatedImage.src).toContain('test2.jpg');
      });
    });

    it('navigates to previous image when clicking previous button', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const prevButton = screen.getByLabelText('Previous image');
      
      // Navigate to last image (should wrap around)
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        const image = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
        expect(image.src).toContain('test3.jpg');
      });
    });

    it('navigates with keyboard arrow keys', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const image = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
      
      expect(image.src).toContain('test1.jpg');
      
      // Press right arrow
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        const updatedImage = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
        expect(updatedImage.src).toContain('test2.jpg');
      });
      
      // Press left arrow
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        const finalImage = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
        expect(finalImage.src).toContain('test1.jpg');
      });
    });

    it('navigates to specific image when clicking indicator dots', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const thirdImageButton = screen.getByLabelText('Go to image 3');
      
      fireEvent.click(thirdImageButton);
      
      await waitFor(() => {
        const image = screen.getByAltText(mockPortfolioItem.title) as HTMLImageElement;
        expect(image.src).toContain('test3.jpg');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      
      const title = screen.getByText(mockPortfolioItem.title);
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('manages focus correctly', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      // Wait for focus to be set on close button
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('traps focus within modal', async () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      const nextButton = screen.getByLabelText('Next image');
      
      // Focus should start on close button
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });
      
      // Tab through focusable elements
      fireEvent.keyDown(document, { key: 'Tab' });
      
      // Should cycle through focusable elements within modal
      expect(document.activeElement).not.toBe(document.body);
    });

    it('prevents body scroll when modal is open', () => {
      render(
        <PortfolioModal
          isOpen={true}
          onClose={mockOnClose}
          portfolioItem={mockPortfolioItem}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
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
  });
});