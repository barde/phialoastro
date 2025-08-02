import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, type Variants } from '../../../lib/framer-motion';
import PortfolioGrid from './PortfolioGrid';
import PortfolioFilter from './PortfolioFilter';
import PortfolioModal from './PortfolioModal';
import { portfolioItemsDE, portfolioItemsEN, categoryMap, categories } from '../data';

// Export Portfolio item interface for use in other components
export interface PortfolioItemData {
  id: number;
  title: string;
  category: string;
  image: string;
  slug: string;
  description: string;
  year: number;
  materials: string[];
  techniques: string[];
  details: string;
  gallery: string[];
  client?: string;
  projectDate?: string;
  availability?: string;
  price?: string;
  tags?: string[];
  youtubeVideoId?: string;
  youtubeAspectRatio?: '16:9' | '9:16';
  videoUrl?: string; // For backward compatibility
}

// Function to get portfolio items with correct language
const getPortfolioItems = (lang: 'en' | 'de'): PortfolioItemData[] => {
  return lang === 'en' ? portfolioItemsEN : portfolioItemsDE;
};

interface PortfolioProps {
  lang?: 'en' | 'de';
}

export default function Portfolio({ lang = 'de' }: PortfolioProps) {
  // Initialize state with the prop value to match SSR
  const [actualLang, setActualLang] = useState<'en' | 'de'>(lang);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Detect language from URL AFTER hydration to avoid mismatches
  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const urlLang = pathname.startsWith('/en') ? 'en' : 'de';
      
      // Only update if different from prop to avoid unnecessary re-renders
      if (urlLang !== lang) {
        setActualLang(urlLang);
      }
      
      // Debug logging
      console.log('Portfolio Language Detection:', {
        propLang: lang,
        urlLang,
        pathname,
        isHydrated: true
      });
    }
  }, [lang]); // Re-run if lang prop changes
  
  const isEnglish = actualLang === 'en';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<PortfolioItemData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Get portfolio items with correct language using useMemo to recalculate when language changes
  const portfolioItems = useMemo(() => getPortfolioItems(actualLang), [actualLang]);
  
  useEffect(() => {
    let items = portfolioItems;
    
    // Apply category filter
    if (activeFilter !== 'all') {
      items = items.filter(item => {
        // For English items, compare directly
        if (item.category === activeFilter) return true;
        
        // For German items, check if the active filter (English) maps to the item's German category
        if (actualLang === 'de' && categoryMap[activeFilter as keyof typeof categoryMap] === item.category) return true;
        
        // For English page with German filter IDs
        if (actualLang === 'en' && item.category === activeFilter) return true;
        
        return false;
      });
    }
    
    // Sort by year (newest first)
    items = [...items].sort((a, b) => b.year - a.year);
    
    setFilteredItems(items);
  }, [activeFilter, portfolioItems, actualLang]);

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
    <section id="portfolio" className="portfolio-section py-24 bg-white" ref={ref} aria-label="Portfolio">
      <div className="container mx-auto px-6">
        {/* Instagram Link */}
        <motion.div
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
        </motion.div>

        {/* Filter */}
        <motion.div
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
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          variants={containerVariants}
          initial="visible"
          animate="visible"
        >
          <PortfolioGrid items={filteredItems} onItemClick={handleItemClick} />
        </motion.div>

        {/* Portfolio Modal */}
        {selectedItem && (
          <PortfolioModal
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
            lang={actualLang}
          />
        )}
      </div>
    </section>
  );
}
