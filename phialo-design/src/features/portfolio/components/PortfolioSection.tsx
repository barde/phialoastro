import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import PortfolioGrid from './OptimizedPortfolioGrid';
import PortfolioFilter from './PortfolioFilter';
import { portfolioItemsDE, portfolioItemsEN, categoryMap, categories } from '../data';
import type { PortfolioItemData } from '../types/portfolio';

// Lazy load the modal component since it's not needed on initial render
const PortfolioModal = lazy(() => import('./PortfolioModal'));

// Re-export for backward compatibility
export type { PortfolioItemData } from '../types/portfolio';

// Function to get portfolio items with correct language
const getPortfolioItems = (lang: 'en' | 'de'): PortfolioItemData[] => {
  return lang === 'en' ? portfolioItemsEN : portfolioItemsDE;
};

interface PortfolioProps {
  lang?: 'en' | 'de';
}

export default function Portfolio({ lang = 'de' }: PortfolioProps) {
  // Use the language prop directly - no client-side detection needed
  const isEnglish = lang === 'en';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<PortfolioItemData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);

  // Get portfolio items with correct language using useMemo to recalculate when language changes
  const portfolioItems = useMemo(() => getPortfolioItems(lang), [lang]);
  
  useEffect(() => {
    let items = portfolioItems;
    
    // Apply category filter
    if (activeFilter !== 'all') {
      items = items.filter(item => {
        // For English items, compare directly
        if (item.category === activeFilter) return true;
        
        // For German items, check if the active filter (English) maps to the item's German category
        if (lang === 'de' && categoryMap[activeFilter as keyof typeof categoryMap] === item.category) return true;
        
        // For English page with German filter IDs
        if (lang === 'en' && item.category === activeFilter) return true;
        
        return false;
      });
    }
    
    // Sort by year (newest first)
    items = [...items].sort((a, b) => b.year - a.year);
    
    setFilteredItems(items);
  }, [activeFilter, portfolioItems, lang]);

  const handleItemClick = (item: PortfolioItemData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };
  return (
    <section id="portfolio" className="portfolio-section py-24 bg-white" aria-label="Portfolio">
      <div className="container mx-auto px-6">
        {/* Instagram Link */}
        <div className="text-center mb-16">
          <div className="text-center">
            <a 
              href="https://www.instagram.com/phialo_design/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-amber-700 hover:text-amber-800 font-medium transition-colors"
            >
              {isEnglish ? "Portfolio on Instagram" : "Portfolio auf Instagram"}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-12">
          <PortfolioFilter
            categories={categories}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isEnglish={isEnglish}
          />
        </div>

        {/* Portfolio Grid */}
        <div>
          <PortfolioGrid items={filteredItems} onItemClick={handleItemClick} lang={lang} />
        </div>

        {/* Portfolio Modal - Lazy loaded */}
        {selectedItem && (
          <Suspense fallback={null}>
            <PortfolioModal
              isOpen={isModalOpen}
              onClose={() => {
                // Find the specific portfolio item element that was clicked
                const itemElement = document.querySelector(`[data-item-id="${selectedItem.id}"]`) as HTMLElement;

                if (itemElement) {
                  // Remove focus from the element to clear focus state
                  itemElement.blur();
                  
                  // Add a class to temporarily disable the hover effect
                  itemElement.classList.add('no-hover-until-leave');

                  // Add a one-time event listener to remove the class when the mouse leaves
                  itemElement.addEventListener('mouseleave', () => {
                    itemElement.classList.remove('no-hover-until-leave');
                  }, { once: true });
                }
                
                setIsModalOpen(false);
                setSelectedItem(null);
              }}
              portfolioItem={selectedItem}
              lang={lang}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
}
