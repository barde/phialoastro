import { useState, useEffect } from 'react';
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

  // Translations for accessibility
  const cardLabel = isHydrated && isEnglish 
    ? `Portfolio item: ${item.title}. Category: ${item.category}. Press Enter or Space to view details.`
    : `Portfolio-Element: ${item.title}. Kategorie: ${item.category}. Drücken Sie Enter oder Leertaste, um Details anzuzeigen.`;

  return (
    // Static wrapper is now the 'group' and handles interaction
    <div
      className="group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 rounded-lg"
      data-testid="portfolio-item"
      data-item-id={item.id}
      role="button"
      tabIndex={0}
      aria-label={cardLabel}
      onClick={() => onItemClick?.(item)}
      onKeyDown={handleKeyDown}
    >
      <MagneticCursor>
        {/* Inner container is for visuals only, no 'group' or event handlers here */}
        <div 
          className="portfolio-item-container overflow-hidden rounded-lg bg-gray-100 aspect-[4/5] transition-all duration-300 group-hover:shadow-lg"
        >
          {/* Image with proper scaling */}
          <img
            src={item.image}
            alt={`${item.title} - ${item.category}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-focus:scale-105"
            loading="lazy"
          />

          {/* Overlay - Fixed opacity transition */}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-[.no-hover-until-leave]:opacity-0 transition-opacity duration-300 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="bg-black/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="font-display text-3xl font-medium mb-2">{item.title}</h3>
                <p className="text-lg text-white/90">{item.category}</p>
              </div>
            </div>
          </div>
        </div>
      </MagneticCursor>
    </div>
  );
}
