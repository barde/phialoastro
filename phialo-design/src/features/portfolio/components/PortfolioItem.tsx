import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import MagneticCursor from '../../../shared/components/effects/MagneticCursor';
import type { PortfolioItemData } from './PortfolioSection';

interface PortfolioItemProps {
  item: PortfolioItemData;
  onItemClick?: (item: PortfolioItemData) => void;
}

export default function PortfolioItem({ item, onItemClick }: PortfolioItemProps) {
  // Initialize with false to match SSR (German is default)
  const [isEnglish, setIsEnglish] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Language detection after hydration
  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const shouldBeEnglish = pathname.startsWith('/en');
      setIsEnglish(shouldBeEnglish);
      
      // Mark component as hydrated for testing
      const element = document.querySelector(`[data-testid="portfolio-item"][data-item-id="${item.id}"]`);
      if (element) {
        element.setAttribute('data-hydrated', 'true');
      }
    }
  }, [item.id]);

  // Keyboard handler for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onItemClick?.(item);
    }
  };

  // Translations - use German as default during SSR
  const detailsText = isHydrated && isEnglish ? 'View Details' : 'Details ansehen';
  const cardLabel = isHydrated && isEnglish 
    ? `Portfolio item: ${item.title}. Category: ${item.category}. Press Enter or Space to view details.`
    : `Portfolio-Element: ${item.title}. Kategorie: ${item.category}. Drücken Sie Enter oder Leertaste, um Details anzuzeigen.`;

  return (
    <MagneticCursor>
      <div 
        className="portfolio-item-container group relative overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 transition-all duration-300 hover:shadow-lg" 
        data-testid="portfolio-item"
        data-item-id={item.id}
        role="button"
        tabIndex={0}
        aria-label={cardLabel}
        onClick={() => onItemClick?.(item)}
        onKeyDown={handleKeyDown}
      >
        {/* Image with proper scaling */}
        <img
          src={item.image}
          alt={`${item.title} - ${item.category}`}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-focus:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="font-display text-xl font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-white/80">{item.category}</p>
            
            {/* Visual indicator for action */}
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-flex items-center text-sm font-medium">
                <Eye size={20} className="mr-2" aria-hidden="true" />
                {detailsText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </MagneticCursor>
  );
}
