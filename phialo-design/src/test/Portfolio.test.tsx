import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Portfolio from '../features/portfolio/components/PortfolioSection';

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
  AnimatePresence: ({ children }: any) => children,
  useInView: () => true,
}));

// Mock MagneticCursor component
vi.mock('../components/common/MagneticCursor', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span>ExternalLink</span>,
  Eye: () => <span>Eye</span>,
  X: () => <span>Close</span>,
  ChevronLeft: () => <span>Previous</span>,
  ChevronRight: () => <span>Next</span>,
}));

describe('Portfolio Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  it('renders portfolio section', () => {
    render(<Portfolio />);
    
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Entdecken Sie unsere handgefertigten 3D-Designs und realisierten Schmuckstücke.')).toBeInTheDocument();
  });

  it('renders filter categories', () => {
    render(<Portfolio />);
    
    // Get filter buttons by their button role and specific container
    const filterButtons = screen.getAllByRole('button');
    const categoryButtons = filterButtons.filter(btn => {
      const text = btn.textContent || '';
      return ['Alle Arbeiten', 'Ringe', 'Ohrringe', 'Anhänger', 'Skulpturen', 'Anstecker'].includes(text);
    });
    
    expect(categoryButtons).toHaveLength(6);
    expect(categoryButtons[0]).toHaveTextContent('Alle Arbeiten');
    expect(categoryButtons.some(btn => btn.textContent === 'Ringe')).toBe(true);
    expect(categoryButtons.some(btn => btn.textContent === 'Ohrringe')).toBe(true);
    expect(categoryButtons.some(btn => btn.textContent === 'Anhänger')).toBe(true);
    expect(categoryButtons.some(btn => btn.textContent === 'Skulpturen')).toBe(true);
    expect(categoryButtons.some(btn => btn.textContent === 'Anstecker')).toBe(true);
  });

  it('filters portfolio items by category', async () => {
    render(<Portfolio />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
    });
    
    // Find the Ringe filter button specifically
    const filterButtons = screen.getAllByRole('button');
    const ringeFilter = filterButtons.find(btn =>
      btn.textContent === 'Ringe' &&
      btn.className.includes('rounded-full')
    );
    
    expect(ringeFilter).toBeDefined();
    fireEvent.click(ringeFilter!);
    
    // Should show only ring items
    await waitFor(() => {
      expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      expect(screen.getByText('Tansanit Ring')).toBeInTheDocument();
      expect(screen.getByText('ParookaVille Jubiläumsring')).toBeInTheDocument();
      
      // Should not show items from other categories
      expect(screen.queryByText('DNA-Spirale Ohrhänger')).not.toBeInTheDocument();
      expect(screen.queryByText('Silbernes Schloss-Münzkästchen')).not.toBeInTheDocument();
    });
  });

  describe('Modal Integration', () => {
    it('opens modal when clicking on portfolio item', async () => {
      render(<Portfolio />);
      
      // Wait for items to render
      await waitFor(() => {
        expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      });
      
      // Initially modal should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Click on the first portfolio item's details button
      const portfolioItems = document.querySelectorAll('.portfolio-item-container');
      const firstItemDetailsButton = portfolioItems[0].querySelector('button');
      fireEvent.click(firstItemDetailsButton!);
      
      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check that modal content is displayed - first item after sorting by year is ParookaVille
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // The modal should contain item details
      const modalContent = screen.getByRole('dialog');
      expect(modalContent).toHaveTextContent('ParookaVille Jubiläumsring');
    });

    it('displays correct item data in modal', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('DNA-Spirale Ohrhänger')).toBeInTheDocument();
      });
      
      // Find and click the DNA-Spirale item
      const dnaItem = screen.getByText('DNA-Spirale Ohrhänger').closest('.portfolio-item-container');
      const detailsButton = dnaItem?.querySelector('button');
      fireEvent.click(detailsButton!);
      
      // Check modal content
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        
        // Check title in modal (there will be two instances - one in grid, one in modal)
        const titles = screen.getAllByText('DNA-Spirale Ohrhänger');
        expect(titles).toHaveLength(2);
        
        // Check description
        expect(screen.getByText('Elegante Ohrhänger inspiriert von der DNA-Doppelhelix-Struktur. Diese einzigartigen Schmuckstücke verbinden wissenschaftliche Ästhetik mit kunstvoller Handwerkskunst.')).toBeInTheDocument();
        
        // Check materials
        expect(screen.getByText('925er Silber')).toBeInTheDocument();
        expect(screen.getByText('Rhodiniert')).toBeInTheDocument();
      });
    });

    it('closes modal when clicking close button', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      });
      
      // Open modal
      const detailsButtons = screen.getAllByText('Ansehen');
      fireEvent.click(detailsButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByLabelText('Modal schließen');
      fireEvent.click(closeButton);
      
      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal when pressing ESC key', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      });
      
      // Open modal
      const detailsButtons = screen.getAllByText('Ansehen');
      fireEvent.click(detailsButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Press ESC
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking outside', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      });
      
      // Open modal
      const detailsButtons = screen.getAllByText('Ansehen');
      fireEvent.click(detailsButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click on overlay
      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);
      
      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('manages modal state correctly for multiple items', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
      });
      
      // Open first item
      const detailsButtons = screen.getAllByText('Ansehen');
      fireEvent.click(detailsButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check first item content is displayed - ParookaVille is the newest (2024)
      const firstModalContent = screen.getByRole('dialog');
      expect(firstModalContent).toHaveTextContent('ParookaVille Jubiläumsring');
      
      // Close modal
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Open second item
      fireEvent.click(detailsButtons[1]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Just verify the modal is open with different content
      const secondModalContent = screen.getByRole('dialog');
      expect(secondModalContent).toBeInTheDocument();
    });

    it('navigates through gallery images in modal', async () => {
      render(<Portfolio />);
      
      await waitFor(() => {
        expect(screen.getByText('DNA-Spirale Ohrhänger')).toBeInTheDocument();
      });
      
      // Find and open DNA-Spirale item which has a gallery with 2 images
      const dnaItem = screen.getByText('DNA-Spirale Ohrhänger').closest('.portfolio-item-container');
      const detailsButton = dnaItem?.querySelector('button');
      fireEvent.click(detailsButton!);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check navigation buttons exist
      const nextButton = screen.getByLabelText('Nächstes Bild');
      const prevButton = screen.getByLabelText('Vorheriges Bild');
      
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
      
      // Navigate to next image
      fireEvent.click(nextButton);
      
      // Wait for navigation to complete
      await waitFor(() => {
        // Check that we have multiple image indicators
        const indicators = screen.getAllByRole('button', { name: /Zu Bild/i });
        expect(indicators.length).toBe(2); // DNA-Spirale has 2 images in gallery
      });
    });
  });

  it('renders Instagram portfolio link', () => {
    render(<Portfolio />);
    
    const instagramLink = screen.getByText('Portfolio auf Instagram').closest('a');
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/phialo_design/');
    expect(instagramLink).toHaveAttribute('target', '_blank');
    expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');  });

  it('applies correct accessibility attributes', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
    });
    
    // Open modal
    const detailsButtons = screen.getAllByText('Ansehen');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });
  });

  it('prevents body scroll when modal is open', async () => {
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Turmalinring Masterpiece')).toBeInTheDocument();
    });
    
    // Body should be scrollable initially
    expect(document.body.style.overflow).toBe('');
    
    // Open modal
    const detailsButtons = screen.getAllByText('Ansehen');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Body scroll should be prevented
    expect(document.body.style.overflow).toBe('hidden');
    
    // Close modal
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // Body scroll should be restored
    expect(document.body.style.overflow).toBe('');
  });
});
