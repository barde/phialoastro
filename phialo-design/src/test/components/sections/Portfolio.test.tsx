import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Portfolio from '../../../components/sections/Portfolio';
import '@testing-library/jest-dom';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  useInView: () => true,
}));

describe('Portfolio Component Language Handling', () => {
  beforeEach(() => {
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { pathname: '/' };
  });

  it('should use German content by default', async () => {
    render(<Portfolio />);
    
    // Wait for hydration
    await waitFor(() => {
      const description = screen.getByText(/entdecken sie unsere handgefertigten/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should use English content when lang="en" is passed', async () => {
    render(<Portfolio lang="en" />);
    
    // Wait for hydration
    await waitFor(() => {
      const description = screen.getByText(/discover our handcrafted/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should detect English from URL path /en/portfolio', async () => {
    // Set English URL
    (window as any).location = { pathname: '/en/portfolio' };
    
    render(<Portfolio />);
    
    // Wait for useEffect to run
    await waitFor(() => {
      const description = screen.getByText(/discover our handcrafted/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should update portfolio items when language changes', async () => {
    // Start with German URL
    (window as any).location = { pathname: '/portfolio' };
    
    const { rerender } = render(<Portfolio lang="de" />);
    
    // Should show German content initially
    await waitFor(() => {
      expect(screen.getByText(/entdecken sie unsere handgefertigten/i)).toBeInTheDocument();
    });
    
    // Open first portfolio item
    const firstItem = screen.getAllByRole('button')[1]; // Skip "All Works" filter button
    fireEvent.click(firstItem);
    
    // Wait for modal
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // Check for German content in modal
    const modalContent = screen.getByRole('dialog').textContent;
    expect(modalContent).toContain('Materialien');
    expect(modalContent).toContain('verbinden');
    
    // Close modal
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Change to English
    (window as any).location = { pathname: '/en/portfolio' };
    rerender(<Portfolio lang="en" />);
    
    // Should show English content
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // Open first portfolio item again
    const firstItemEn = screen.getAllByRole('button')[1];
    fireEvent.click(firstItemEn);
    
    // Wait for modal
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
    
    // Check for English content in modal
    const modalContentEn = screen.getByRole('dialog').textContent;
    expect(modalContentEn).toContain('Materials');
    expect(modalContentEn).toContain('combine');
    expect(modalContentEn).not.toContain('verbinden');
  });

  it('should not show German words in English portfolio items', async () => {
    (window as any).location = { pathname: '/en/portfolio' };
    
    render(<Portfolio lang="en" />);
    
    // Wait for component to hydrate
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // German words that should NOT appear
    const germanWords = [
      'verbinden',
      'einzigartigen',
      'Diese',
      'wissenschaftliche',
      'Ästhetik',
      'kunstvoller',
      'Handwerkskunst'
    ];
    
    // Open each portfolio item and check content
    const portfolioButtons = screen.getAllByRole('button').filter(btn => 
      !btn.textContent?.includes('All Works') && 
      !btn.textContent?.includes('Rings') &&
      !btn.textContent?.includes('Earrings')
    );
    
    for (let i = 0; i < Math.min(3, portfolioButtons.length); i++) {
      fireEvent.click(portfolioButtons[i]);
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      });
      
      const modalContent = screen.getByRole('dialog').textContent || '';
      
      // Check that no German words appear
      germanWords.forEach(word => {
        expect(modalContent).not.toContain(word);
      });
      
      // Check for English equivalents
      if (i === 0) { // First item (DNA Spiral)
        expect(modalContent).toContain('combine');
        expect(modalContent).toContain('scientific aesthetics');
      }
      
      // Close modal
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    }
  });

  it('should maintain language consistency across filter changes', async () => {
    (window as any).location = { pathname: '/en/portfolio' };
    
    render(<Portfolio lang="en" />);
    
    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // Click on "Rings" filter
    const ringsFilter = screen.getByText('Rings');
    fireEvent.click(ringsFilter);
    
    // Portfolio items should still be in English
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const ringItems = buttons.filter(btn => 
        btn.textContent?.includes('Ring') && 
        !btn.textContent?.includes('Rings') // Not the filter button
      );
      expect(ringItems.length).toBeGreaterThan(0);
    });
    
    // Open a ring item
    const ringButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Ring') && 
      !btn.textContent?.includes('Rings')
    );
    
    if (ringButtons.length > 0) {
      fireEvent.click(ringButtons[0]);
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      });
      
      // Check for English content
      const modalContent = screen.getByRole('dialog').textContent || '';
      expect(modalContent).toContain('Materials');
      expect(modalContent).not.toContain('Materialien');
    }
  });

  it('should sort portfolio items by year (newest first)', async () => {
    render(<Portfolio />);
    
    // Wait for component to render
    await waitFor(() => {
      const portfolioButtons = screen.getAllByRole('button').filter(btn => 
        !btn.textContent?.includes('All') &&
        !btn.textContent?.includes('Alle') &&
        !btn.textContent?.includes('Rings') &&
        !btn.textContent?.includes('Ringe') &&
        !btn.textContent?.includes('Earrings') &&
        !btn.textContent?.includes('Ohrringe') &&
        !btn.textContent?.includes('Pendants') &&
        !btn.textContent?.includes('Anhänger') &&
        !btn.textContent?.includes('Sculptures') &&
        !btn.textContent?.includes('Skulpturen') &&
        !btn.textContent?.includes('Pins') &&
        !btn.textContent?.includes('Anstecker')
      );
      
      // Check that ParookaVille Ring (2024) appears first
      expect(portfolioButtons[0].textContent).toContain('ParookaVille');
      
      // The order should be: 2024 items first, then 2023, then 2022
      // We can't check exact order without knowing all titles, but we can verify
      // that ParookaVille (2024) comes before Silver Crown (2022)
      const parookaIndex = portfolioButtons.findIndex(btn => 
        btn.textContent?.includes('ParookaVille')
      );
      const crownIndex = portfolioButtons.findIndex(btn => 
        btn.textContent?.includes('Madonna-Krone') || btn.textContent?.includes('Madonna Crown')
      );
      
      expect(parookaIndex).toBeLessThan(crownIndex);
    });
  });

  it('should maintain sorting when filtering by category', async () => {
    render(<Portfolio />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/Ringe|Rings/)).toBeInTheDocument();
    });
    
    // Click on Rings filter
    const ringsFilter = screen.getByText(/Ringe|Rings/);
    fireEvent.click(ringsFilter);
    
    // Wait for filtered items
    await waitFor(() => {
      const portfolioButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Ring') &&
        !btn.textContent?.includes('Rings') &&
        !btn.textContent?.includes('Ringe')
      );
      
      // ParookaVille Ring (2024) should still appear before other rings
      const ringTitles = portfolioButtons.map(btn => btn.textContent);
      const parookaIndex = ringTitles.findIndex(title => 
        title?.includes('ParookaVille')
      );
      
      // Should be at or near the beginning (allowing for potential other 2024 rings)
      expect(parookaIndex).toBeLessThanOrEqual(1);
    });
  });
});