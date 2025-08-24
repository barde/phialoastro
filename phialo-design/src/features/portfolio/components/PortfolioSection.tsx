import { useState, useEffect, useMemo } from 'react';
import { m, LazyMotion, domAnimation, type Variants } from '../../../lib/framer-motion';
import PortfolioGrid from './OptimizedPortfolioGrid';
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
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <section id="portfolio" className="portfolio-section py-24 bg-white" aria-label="Portfolio">
      <div className="container mx-auto px-6">
        {/* Instagram Link */}
        <m.div
          variants={itemVariants}
          initial="visible"
          animate="visible"
          className="text-center mb-16"
        >
          <div className="text-center">
            <a 
              href="https://www.instagram.com/phialo_design/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-gold hover:text-gold/80 font-medium transition-colors"
            >
              {isEnglish ? "Portfolio on Instagram" : "Portfolio auf Instagram"}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>            </a>
          </div>
        </m.div>

        {/* Filter */}
        <m.div
          variants={itemVariants}
          initial="visible"
          animate="visible"
          className="mb-12"
        >
          <PortfolioFilter
            categories={categories}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isEnglish={isEnglish}
          />
        </m.div>

        {/* Portfolio Grid */}
        <m.div
          variants={containerVariants}
          initial="visible"
          animate="visible"
        >
          <PortfolioGrid items={filteredItems} onItemClick={handleItemClick} lang={lang} />
        </m.div>

        {/* Portfolio Modal */}
        {selectedItem && (
          <PortfolioModalCSS
            isOpen={isModalOpen}
            onClose={() => {
              // Find the specific portfolio item element that was clicked
              const itemElement = document.querySelector(`[data-item-id="${selectedItem.id}"]`);

              if (itemElement) {
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
        )}
      </div>
      </section>
    </LazyMotion>
  );
}
