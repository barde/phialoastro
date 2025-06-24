import { useState, useEffect } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
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

  // Translations - use German as default during SSR
  const detailsText = isHydrated && isEnglish ? 'Details' : 'Ansehen';
  return (
    <MagneticCursor>
      <div 
        className="portfolio-item-container group relative overflow-hidden rounded-lg bg-gray-100 h-full" 
        data-testid="portfolio-item"
        data-item-id={item.id}
      >
        {/* Image with proper scaling */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-contain transition-all duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="font-display text-xl font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-white/80 mb-4">{item.category}</p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => onItemClick && onItemClick(item)}
                className="inline-flex items-center px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
                data-testid="portfolio-details-button"
              >
                <Eye size={16} className="mr-2.5" />
                {detailsText}
              </button>
              <button className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>        </div>
      </div>
    </MagneticCursor>
  );
}
