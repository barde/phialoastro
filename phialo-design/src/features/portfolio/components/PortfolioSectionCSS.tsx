import { useState, useEffect, useMemo, useCallback } from 'react';
import PortfolioGridCSS from './PortfolioGridCSS';
import PortfolioFilter from './PortfolioFilter';
import PortfolioModalCSS from './PortfolioModalCSS';
import { portfolioItemsDE, portfolioItemsEN, categoryMap, categories } from '../data';
import type { PortfolioItemData } from '../types/portfolio';

// Re-export for backward compatibility
export type { PortfolioItemData } from '../types/portfolio';

// Function to get portfolio items with correct language
const getPortfolioItems = (lang: 'en' | 'de'): PortfolioItemData[] => {
  return lang === 'en' ? portfolioItemsEN : portfolioItemsDE;
};

interface PortfolioProps {
  lang?: 'en' | 'de';
}

/**
 * CSS-only version of PortfolioSection without Framer Motion
 * Uses CSS animations for all transitions
 */
export default function PortfolioSectionCSS({ lang = 'de' }: PortfolioProps) {
  const isEnglish = lang === 'en';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<PortfolioItemData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);

  // Get portfolio items with correct language using useMemo
  const portfolioItems = useMemo(() => getPortfolioItems(lang), [lang]);

  // Filter items based on active category
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(portfolioItems);
    } else {
      const filtered = portfolioItems.filter(item => 
        item.category === activeFilter
      );
      setFilteredItems(filtered);
    }
  }, [activeFilter, portfolioItems]);

  // Handle item click
  const handleItemClick = useCallback((item: PortfolioItemData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  // Handle modal navigation
  const handleModalNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedItem) return;
    
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? filteredItems.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === filteredItems.length - 1 ? 0 : currentIndex + 1;
    }
    
    setSelectedItem(filteredItems[newIndex]);
  }, [selectedItem, filteredItems]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    const itemElement = document.querySelector(`[data-item-id="${selectedItem?.id}"]`);
    
    if (itemElement) {
      // Add a class to temporarily disable the hover effect
      itemElement.classList.add('no-hover');
      
      // Remove the class after a short delay
      setTimeout(() => {
        itemElement.classList.remove('no-hover');
      }, 300);
    }
    
    setIsModalOpen(false);
    // Don't clear selectedItem immediately to prevent modal content flash
    setTimeout(() => {
      setSelectedItem(null);
    }, 300);
  }, [selectedItem]);

  // Get localized category labels
  const localizedCategories = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      label: isEnglish && categoryMap[cat.value] 
        ? categoryMap[cat.value] 
        : cat.label
    }));
  }, [isEnglish]);

  return (
    <div className="portfolio-section">
      {/* Portfolio Filter */}
      <div className="portfolio-filter-wrapper">
        <PortfolioFilter
          categories={localizedCategories}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Portfolio Grid */}
      <div className="portfolio-grid-wrapper">
        <PortfolioGridCSS
          items={filteredItems}
          onItemClick={handleItemClick}
          lang={lang}
        />
      </div>

      {/* Portfolio Modal */}
      {selectedItem && (
        <PortfolioModalCSS
          isOpen={isModalOpen}
          onClose={handleModalClose}
          item={selectedItem}
          language={lang}
          onNavigate={handleModalNavigate}
          hasNavigation={filteredItems.length > 1}
        />
      )}

      <style jsx>{`
        .portfolio-section {
          width: 100%;
          padding: 2rem 0;
        }

        .portfolio-filter-wrapper {
          margin-bottom: 3rem;
          animation: fadeIn 0.5s ease-out;
        }

        .portfolio-grid-wrapper {
          animation: fadeIn 0.5s ease-out 0.2s both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.no-hover) {
          pointer-events: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .portfolio-filter-wrapper,
          .portfolio-grid-wrapper {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}