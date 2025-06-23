import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioFilter from '../../../features/portfolio/components/PortfolioFilter';

describe('PortfolioFilter', () => {
  const mockCategories = [
    { id: 'all', label: 'Alle Arbeiten', labelEn: 'All Works' },
    { id: 'rings', label: 'Ringe', labelEn: 'Rings' },
    { id: 'earrings', label: 'Ohrringe', labelEn: 'Earrings' },
    { id: 'pendants', label: 'Anhänger', labelEn: 'Pendants' },
  ];

  const mockOnFilterChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all category buttons', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Alle Arbeiten')).toBeInTheDocument();
      expect(screen.getByText('Ringe')).toBeInTheDocument();
      expect(screen.getByText('Ohrringe')).toBeInTheDocument();
      expect(screen.getByText('Anhänger')).toBeInTheDocument();
    });

    it('should render with proper container structure', () => {
      const { container } = render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      const filterContainer = container.firstChild;
      expect(filterContainer).toHaveClass('flex', 'flex-wrap', 'justify-center', 'gap-4');
    });
  });

  describe('Language Support', () => {
    it('should show German labels by default', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      mockCategories.forEach(category => {
        expect(screen.getByText(category.label)).toBeInTheDocument();
      });
    });

    it('should show English labels when isEnglish is true', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          isEnglish={true}
        />
      );

      mockCategories.forEach(category => {
        if (category.labelEn) {
          expect(screen.getByText(category.labelEn)).toBeInTheDocument();
        }
      });
    });

    it('should fall back to German label if English label is missing', () => {
      const categoriesWithMissingEn = [
        { id: 'test', label: 'Test German' }, // No labelEn
      ];

      render(
        <PortfolioFilter
          categories={categoriesWithMissingEn}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          isEnglish={true}
        />
      );

      expect(screen.getByText('Test German')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight the active filter', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="rings"
          onFilterChange={mockOnFilterChange}
        />
      );

      const activeButton = screen.getByText('Ringe');
      expect(activeButton).toHaveClass('bg-gold', 'text-white', 'shadow-sm');
    });

    it('should style inactive filters differently', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="rings"
          onFilterChange={mockOnFilterChange}
        />
      );

      const inactiveButton = screen.getByText('Ohrringe');
      expect(inactiveButton).toHaveClass('text-gray-600');
      expect(inactiveButton).not.toHaveClass('bg-gold');
    });

    it('should update active state when activeFilter prop changes', () => {
      const { rerender } = render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Alle Arbeiten')).toHaveClass('bg-gold');

      rerender(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="earrings"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Alle Arbeiten')).not.toHaveClass('bg-gold');
      expect(screen.getByText('Ohrringe')).toHaveClass('bg-gold');
    });
  });

  describe('Interactions', () => {
    it('should call onFilterChange when clicking a filter', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByText('Ringe'));

      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
      expect(mockOnFilterChange).toHaveBeenCalledWith('rings');
    });

    it('should call onFilterChange even when clicking the active filter', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="rings"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByText('Ringe'));

      expect(mockOnFilterChange).toHaveBeenCalledWith('rings');
    });

    it('should handle multiple filter changes', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByText('Ringe'));
      fireEvent.click(screen.getByText('Ohrringe'));
      fireEvent.click(screen.getByText('Alle Arbeiten'));

      expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(1, 'rings');
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(2, 'earrings');
      expect(mockOnFilterChange).toHaveBeenNthCalledWith(3, 'all');
    });
  });

  describe('Styling', () => {
    it('should apply common button styles to all filters', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'px-6',
          'py-2',
          'text-sm',
          'font-medium',
          'rounded-full',
          'transition-all',
          'duration-200'
        );
      });
    });

    it('should have hover styles on inactive filters', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="rings"
          onFilterChange={mockOnFilterChange}
        />
      );

      const inactiveButton = screen.getByText('Ohrringe');
      expect(inactiveButton).toHaveClass('hover:text-midnight', 'hover:bg-gray-100');
    });
  });

  describe('Accessibility', () => {
    it('should render buttons with button role', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(mockCategories.length);
    });

    it('should be keyboard accessible', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      const firstButton = screen.getByText('Alle Arbeiten');
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty categories array', () => {
      render(
        <PortfolioFilter
          categories={[]}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle categories with special characters', () => {
      const specialCategories = [
        { id: 'test-1', label: 'Test & Category' },
        { id: 'test-2', label: 'Category "with" quotes' },
      ];

      render(
        <PortfolioFilter
          categories={specialCategories}
          activeFilter="test-1"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('Test & Category')).toBeInTheDocument();
      expect(screen.getByText('Category "with" quotes')).toBeInTheDocument();
    });

    it('should handle activeFilter that does not match any category', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="non-existent"
          onFilterChange={mockOnFilterChange}
        />
      );

      // All buttons should be inactive
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('bg-gold');
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many categories', () => {
      const manyCategories = Array.from({ length: 20 }, (_, i) => ({
        id: `cat-${i}`,
        label: `Category ${i}`,
        labelEn: `Category ${i} EN`,
      }));

      render(
        <PortfolioFilter
          categories={manyCategories}
          activeFilter="cat-0"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(20);
    });
  });

  describe('Component Props', () => {
    it('should handle missing isEnglish prop gracefully', () => {
      render(
        <PortfolioFilter
          categories={mockCategories}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
          // isEnglish prop omitted
        />
      );

      // Should default to German (isEnglish = false)
      mockCategories.forEach(category => {
        expect(screen.getByText(category.label)).toBeInTheDocument();
      });
    });
  });
});