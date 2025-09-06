import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioFilter from './PortfolioFilter';
import '@testing-library/jest-dom';

const categories = [
    { id: 'all', label: 'Alle', labelEn: 'All' },
    { id: 'cat1', label: 'Kategorie 1', labelEn: 'Category 1' },
    { id: 'cat2', label: 'Kategorie 2', labelEn: 'Category 2' },
];

describe('PortfolioFilter', () => {
    it('should render all categories', () => {
        render(
            <PortfolioFilter
                categories={categories}
                activeFilter="all"
                onFilterChange={() => {}}
            />
        );

        expect(screen.getByRole('button', { name: 'Alle' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Kategorie 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Kategorie 2' })).toBeInTheDocument();
    });

    it('should highlight the active filter', () => {
        render(
            <PortfolioFilter
                categories={categories}
                activeFilter="cat1"
                onFilterChange={() => {}}
            />
        );

        const activeButton = screen.getByRole('button', { name: 'Kategorie 1' });
        expect(activeButton).toHaveClass('bg-amber-700');
    });

    it('should call onFilterChange with the correct category on click', () => {
        const onFilterChange = vi.fn();
        render(
            <PortfolioFilter
                categories={categories}
                activeFilter="all"
                onFilterChange={onFilterChange}
            />
        );

        const categoryButton = screen.getByRole('button', { name: 'Kategorie 2' });
        fireEvent.click(categoryButton);

        expect(onFilterChange).toHaveBeenCalledWith('cat2');
    });

    it('should display English labels when isEnglish is true', () => {
        render(
            <PortfolioFilter
                categories={categories}
                activeFilter="all"
                onFilterChange={() => {}}
                isEnglish
            />
        );

        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Category 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Category 2' })).toBeInTheDocument();
    });
});
