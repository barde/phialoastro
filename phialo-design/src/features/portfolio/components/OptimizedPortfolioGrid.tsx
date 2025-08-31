import React, { useCallback, useEffect, useState } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import MagneticCursor from '../../../shared/components/effects/MagneticCursor';
import OptimizedPicture from '../../../shared/components/OptimizedPicture';
import { useAdaptiveLoading } from '../../../utils/adaptive-loading';
import type { PortfolioItemData } from './PortfolioSection';

interface OptimizedPortfolioGridProps {
  items: PortfolioItemData[];
  onItemClick?: (item: PortfolioItemData) => void;
  lang?: 'en' | 'de';
}

// Alias for backward compatibility
export interface PortfolioGridProps extends OptimizedPortfolioGridProps {}

// Grid container variants for staggered animation (unused but kept for reference)
const _gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Reduced stagger for faster perceived loading
      delayChildren: 0.1,
    },
  },
};

// Item variants with reduced m complexity
const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, // Reduced distance for smoother animation
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25, // Increased damping for less bouncy animation
      stiffness: 120, // Slightly increased for snappier response
      mass: 0.5, // Reduced mass for lighter feel
    },
  },
};

function OptimizedPortfolioItem({ 
  item, 
  index, 
  onItemClick, 
  lang = 'de' 
}: { 
  item: PortfolioItemData; 
  index: number;
  onItemClick?: (item: PortfolioItemData) => void; 
  lang?: 'en' | 'de';
}) {
  const isEnglish = lang === 'en';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use adaptive loading to determine preload count
  const { preloadCount } = useAdaptiveLoading();

  // Determine if this is a priority image based on adaptive loading
  const isPriority = index < preloadCount;

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onItemClick?.(item);
    }
  }, [item, onItemClick]);

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    console.error(`Failed to load image: ${item.image}`);
  }, [item.image]);

  // Check if image is already loaded (from cache)
  useEffect(() => {
    // Extract filename for WebP version
    const filename = item.image.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    const basePath = item.image.substring(0, item.image.lastIndexOf('/'));
    
    // Use WebP version for preloading
    const webpSrc = `${basePath}/${filename}-800w.webp`;
    
    const img = new Image();
    img.src = webpSrc;
    
    if (img.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      img.onload = handleImageLoad;
      img.onerror = () => {
        // If WebP fails, don't fallback to JPG - just log the error
        console.error(`Failed to load WebP image: ${webpSrc}`);
        handleImageError();
      };
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [item.image, handleImageLoad, handleImageError]);

  // Translations for accessibility
  const cardLabel = isEnglish 
    ? `Portfolio item: ${item.title}. Category: ${item.category}. Press Enter or Space to view details.`
    : `Portfolio-Element: ${item.title}. Kategorie: ${item.category}. Drücken Sie Enter oder Leertaste, um Details anzuzeigen.`;

  return (
    <m.div
      variants={itemVariants}
      layout
      className="portfolio-item"
      style={{
        // CSS containment for performance
        contain: 'layout style paint',
      }}
    >
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
          <div className="portfolio-item-container overflow-hidden rounded-lg aspect-[4/5] transition-all duration-300 group-hover:shadow-lg">
            {/* Show placeholder while image loads */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
            )}
            
            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-400">Failed to load image</span>
              </div>
            )}
            
            {/* Optimized image with modern formats */}
            <OptimizedPicture
              src={item.image}
              alt={`${item.title} - ${item.category}`}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 group-focus:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading={isPriority ? 'eager' : 'lazy'}
              fetchPriority={isPriority ? 'high' : 'auto'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              width={800}
              height={1000}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none">
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
    </m.div>
  );
}

export default function OptimizedPortfolioGrid({ 
  items, 
  onItemClick, 
  lang = 'de' 
}: OptimizedPortfolioGridProps) {
  // Use adaptive loading for performance optimization
  const { 
    animationSettings
  } = useAdaptiveLoading();
  
  // Check for reduced m preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Use adaptive animations based on device capability
  const effectiveVariants = !animationSettings.animate || prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: animationSettings.stagger,
            delayChildren: animationSettings.duration * 0.2,
          },
        },
      };

  const effectiveItemVariants = !animationSettings.animate || prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { 
          opacity: 0, 
          y: animationSettings.complexity === 'simple' ? 10 : 20,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring" as const,
            damping: 30,
            stiffness: 150,
            mass: animationSettings.complexity === 'simple' ? 0.3 : 0.5,
            duration: animationSettings.duration,
          },
        },
      };

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className="portfolio-grid"
        data-testid="portfolio-grid"
      variants={effectiveVariants}
      initial="hidden"
      animate="visible"
      style={{
        // Prevent layout shifts
        minHeight: items.length > 0 ? '500px' : 'auto',
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <OptimizedPortfolioItem
            key={item.id}
            item={item}
            index={index}
            onItemClick={onItemClick}
            lang={lang}
          />
        ))}
      </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
}