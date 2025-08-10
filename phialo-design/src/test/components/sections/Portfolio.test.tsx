import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Portfolio from '../../../features/portfolio/components/PortfolioSection';
import '@testing-library/jest-dom';

// Mock framer-motion from our lib
vi.mock('../../../lib/framer-motion', () => ({
  motion: {
    div: ({ children, layout, layoutId, drag, dragConstraints, dragElastic, ...props }: any) => {
      // Filter out framer-motion specific props
      const { animate, initial, exit, transition, variants, whileHover, whileTap, whileInView, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    },
    section: ({ children, layout, layoutId, ...props }: any) => {
      const { animate, initial, exit, transition, variants, whileHover, whileTap, whileInView, ...restProps } = props;
      return <section {...restProps}>{children}</section>;
    },
    button: ({ children, ...props }: any) => {
      const { animate, initial, exit, transition, variants, whileHover, whileTap, ...restProps } = props;
      return <button {...restProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => true,
  useAnimation: () => ({
    start: vi.fn(),
    set: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock MagneticCursor component
vi.mock('../../../shared/components/effects/MagneticCursor', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  Eye: () => <span>Eye</span>,
}));

describe('Portfolio Component Language Handling', () => {
  beforeEach(() => {
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { pathname: '/' };
  });

  it('should use German content by default', async () => {
    render(<Portfolio />);
    
    // Wait for hydration and useEffect
    await waitFor(() => {
      const description = screen.getByText(/entdecken sie unsere handgefertigten/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should use English content when URL is /en/', async () => {
    // Set English URL before rendering
    (window as any).location = { pathname: '/en/' };
    
    render(<Portfolio />);
    
    // Wait for hydration and useEffect to detect language from URL
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

  it('should show correct language content in portfolio items', async () => {
    // Test German content
    (window as any).location = { pathname: '/portfolio' };
    
    const { unmount } = render(<Portfolio />);
    
    // Should show German content initially
    await waitFor(() => {
      expect(screen.getByText(/entdecken sie unsere handgefertigten/i)).toBeInTheDocument();
    });
    
    // Check that German filter labels are shown
    const filterButtons = screen.getAllByRole('button');
    const filterTexts = filterButtons.map(btn => btn.textContent);
    expect(filterTexts).toContain('Alle Arbeiten');
    expect(filterTexts).toContain('Ringe');
    expect(filterTexts).toContain('Ohrringe');
    
    // Check that portfolio items have German titles
    const germanTitles = screen.getAllByRole('heading', { level: 3 });
    const germanTitleTexts = germanTitles.map(el => el.textContent);
    expect(germanTitleTexts).toContain('ParookaVille Jubiläumsring');
    expect(germanTitleTexts).toContain('DNA-Spirale Ohrhänger');
    
    // Unmount German version
    unmount();
    
    // Test English content with a fresh component
    (window as any).location = { pathname: '/en/portfolio' };
    render(<Portfolio />);
    
    // Should show English content
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // Check that English filter labels are shown
    const filterButtonsEn = screen.getAllByRole('button');
    const filterTextsEn = filterButtonsEn.map(btn => btn.textContent);
    expect(filterTextsEn).toContain('All Works');
    expect(filterTextsEn).toContain('Rings');
    expect(filterTextsEn).toContain('Earrings');
    
    // Check that portfolio items have English titles
    const englishTitles = screen.getAllByRole('heading', { level: 3 });
    const englishTitleTexts = englishTitles.map(el => el.textContent);
    expect(englishTitleTexts).toContain('ParookaVille Anniversary Ring');
    expect(englishTitleTexts).toContain('DNA Spiral Earrings');
  });

  it('should not show German words in English portfolio items', async () => {
    (window as any).location = { pathname: '/en/portfolio' };
    
    render(<Portfolio />);
    
    // Wait for component to hydrate
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // German words that should NOT appear in UI
    const germanWords = [
      'Entdecken Sie',
      'handgefertigten',
      'Alle Arbeiten',
      'Ringe',
      'Ohrringe',
      'Anhänger',
      'Skulpturen',
      'Anstecker'
    ];
    
    // Get all text content from the portfolio section
    const portfolioSection = screen.getByRole('region', { name: /portfolio/i }).textContent || '';
    
    // Check that no German words appear in the UI
    germanWords.forEach(word => {
      expect(portfolioSection).not.toContain(word);
    });
    
    // Check that English equivalents are present
    expect(portfolioSection).toContain('All Works');
    expect(portfolioSection).toContain('Rings');
    expect(portfolioSection).toContain('Earrings');
    expect(portfolioSection).toContain('Pendants');
    expect(portfolioSection).toContain('Sculptures');
    expect(portfolioSection).toContain('Pins');
  });

  it('should maintain language consistency across filter changes', async () => {
    (window as any).location = { pathname: '/en/portfolio' };
    
    render(<Portfolio />);
    
    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText(/discover our handcrafted/i)).toBeInTheDocument();
    });
    
    // Initially, all items should be shown with English titles
    const allTitles = screen.getAllByRole('heading', { level: 3 });
    const titleTexts = allTitles.map(el => el.textContent);
    expect(titleTexts).toContain('ParookaVille Anniversary Ring');
    
    // Click on "Rings" filter button
    const filterButtons = screen.getAllByRole('button');
    const ringsFilter = filterButtons.find(btn => 
      btn.textContent === 'Rings' && 
      btn.className.includes('px-6 py-2')
    );
    expect(ringsFilter).toBeDefined();
    fireEvent.click(ringsFilter!);
    
    // After filtering, only ring items should be shown, still in English
    await waitFor(() => {
      const filteredTitles = screen.getAllByRole('heading', { level: 3 });
      const filteredTitleTexts = filteredTitles.map(el => el.textContent);
      
      // All visible items should be rings
      filteredTitleTexts.forEach(title => {
        expect(title).toMatch(/Ring/);
      });
      
      // Should still have English names
      expect(filteredTitleTexts.some(title => title?.includes('Anniversary Ring'))).toBe(true);
      
      // Should not have German names
      expect(filteredTitleTexts.some(title => title?.includes('Jubiläumsring'))).toBe(false);
    });
  });

  it('should sort portfolio items by year (newest first)', async () => {
    render(<Portfolio />);
    
    // Wait for component to render
    await waitFor(() => {
      const portfolioTitles = screen.getAllByRole('heading', { level: 3 });
      expect(portfolioTitles.length).toBeGreaterThan(0);
    });
    
    const portfolioTitles = screen.getAllByRole('heading', { level: 3 });
    const titleTexts = portfolioTitles.map(el => el.textContent);
    
    // Check that ParookaVille Ring (2024) appears first
    expect(titleTexts[0]).toContain('ParookaVille');
    
    // The order should be: 2024 items first, then 2023, then 2022
    // We can verify that ParookaVille (2024) comes before Silver Crown (2022)
    const parookaIndex = titleTexts.findIndex(title => 
      title?.includes('ParookaVille')
    );
    const crownIndex = titleTexts.findIndex(title => 
      title?.includes('Madonna-Krone') || title?.includes('Madonna Crown')
    );
    
    expect(parookaIndex).toBeDefined();
    expect(crownIndex).toBeDefined();
    expect(parookaIndex).toBeLessThan(crownIndex);
  });

  it('should maintain sorting when filtering by category', async () => {
    render(<Portfolio />);
    
    // Wait for initial render
    await waitFor(() => {
      const filterButtons = screen.getAllByRole('button');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
    
    // Click on Rings filter
    const filterButtons = screen.getAllByRole('button');
    const ringsFilter = filterButtons.find(btn => 
      (btn.textContent === 'Ringe' || btn.textContent === 'Rings') && 
      btn.className.includes('px-6 py-2')
    );
    expect(ringsFilter).toBeDefined();
    fireEvent.click(ringsFilter!);
    
    // Wait for filtered items
    await waitFor(() => {
      const ringTitles = screen.getAllByRole('heading', { level: 3 });
      expect(ringTitles.length).toBeGreaterThan(0);
      
      // All items should be rings
      ringTitles.forEach(title => {
        expect(title.textContent).toMatch(/[Rr]ing/);
      });
    });
    
    const ringTitles = screen.getAllByRole('heading', { level: 3 });
    const ringTitleTexts = ringTitles.map(el => el.textContent);
    
    // ParookaVille Ring (2024) should still appear before other rings
    const parookaIndex = ringTitleTexts.findIndex(title => 
      title?.includes('ParookaVille')
    );
    
    // Should be at the beginning (first ring)
    expect(parookaIndex).toBe(0);
  });
});