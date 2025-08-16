import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '../../../lib/framer-motion';
import PortfolioItem from './PortfolioItem';
import type { PortfolioItemData } from './PortfolioSection';
import { useAdaptiveLoading } from '../../../utils/adaptive-loading';

interface OptimizedPortfolioGridProps {
  items: PortfolioItemData[];
  onItemClick?: (item: PortfolioItemData) => void;
  lang?: 'en' | 'de';
}

export default function OptimizedPortfolioGrid({ 
  items, 
  onItemClick, 
  lang = 'de' 
}: OptimizedPortfolioGridProps) {
  const adaptiveLoading = useAdaptiveLoading();
  const animationSettings = adaptiveLoading.animationSettings;
  const imageQuality = adaptiveLoading.imageQuality;
  const loadingStrategy = adaptiveLoading.loadingStrategy;
  const shouldEnableFeature = adaptiveLoading.shouldEnableFeature;

  // State for lazy loading
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Adaptive animation variants based on device capabilities
  const itemVariants = useMemo(() => {
    if (!animationSettings.animate) {
      return {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 }
      };
    }

    return {
      hidden: { 
        opacity: 0, 
        y: animationSettings.complexity === 'simple' ? 10 : 30 
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: animationSettings.complexity === 'simple' 
          ? {
              type: 'tween' as const,
              duration: animationSettings.duration
            }
          : {
              type: 'spring' as const,
              duration: animationSettings.duration,
              damping: 20,
              stiffness: 100
            }
      }
    };
  }, [animationSettings]);

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (!loadingStrategy.useIntersectionObserver) {
      // Load all items if intersection observer is disabled
      setVisibleItems(new Set(items.map(item => String(item.id))));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-item-id');
            if (id) {
              setVisibleItems(prev => new Set(prev).add(id));
            }
          }
        });
      },
      {
        rootMargin: loadingStrategy.lazyLoadOffset,
        threshold: 0.1
      }
    );

    // Observe all item containers
    itemRefs.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadingStrategy, items]);

  // Touch gesture handling for mobile swipe actions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe || isRightSwipe) {
      // Handle swipe gestures if needed
      // For example, could trigger a carousel-like behavior
      if (gridRef.current) {
        const scrollAmount = isLeftSwipe ? 300 : -300;
        gridRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, [touchStart, touchEnd]);

  // Preload next items based on strategy
  const preloadNextItems = useCallback((currentIndex: number) => {
    const preloadCount = loadingStrategy.preloadCount;
    const nextItems = items.slice(currentIndex + 1, currentIndex + 1 + preloadCount);
    
    nextItems.forEach(item => {
      // Trigger preloading by adding to visible items
      setVisibleItems(prev => new Set(prev).add(String(item.id)));
    });
  }, [items, loadingStrategy.preloadCount]);

  // Handle item click with preloading
  const handleItemClick = useCallback((item: PortfolioItemData, index: number) => {
    if (onItemClick) {
      onItemClick(item);
      // Preload next items when user interacts
      preloadNextItems(index);
    }
  }, [onItemClick, preloadNextItems]);

  // Set ref for each item
  const setItemRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
      observerRef.current?.observe(element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Determine image loading strategy based on quality setting
  const getImageProps = useCallback((item: PortfolioItemData) => {
    const baseProps = {
      src: item.image,
      alt: item.title,
      loading: 'lazy' as const,
    };

    switch (imageQuality) {
      case 'low':
        return {
          ...baseProps,
          src: item.image, // Use base image for low quality
          quality: 60,
        };
      case 'medium':
        return {
          ...baseProps,
          quality: 75,
        };
      case 'high':
      default:
        return {
          ...baseProps,
          quality: 90,
          fetchPriority: 'high' as const, // Prioritize high-quality images
        };
    }
  }, [imageQuality]);

  // Mobile-optimized grid layout
  const gridClassName = useMemo(() => {
    const classes = ['portfolio-grid', 'touch-friendly'];
    
    if (shouldEnableFeature && shouldEnableFeature('blur')) {
      classes.push('with-blur-effects');
    }
    
    if (shouldEnableFeature && !shouldEnableFeature('animations')) {
      classes.push('no-animations');
    }
    
    return classes.join(' ');
  }, [shouldEnableFeature]);

  return (
    <div 
      ref={gridRef}
      className={gridClassName}
      data-testid="optimized-portfolio-grid"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        // Optimize for touch scrolling on mobile
        WebkitOverflowScrolling: 'touch',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
      }}
    >
      <AnimatePresence mode="wait">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            ref={(el) => setItemRef(String(item.id), el)}
            data-item-id={String(item.id)}
            variants={itemVariants}
            initial="hidden"
            animate={visibleItems.has(String(item.id)) ? "visible" : "hidden"}
            layout={shouldEnableFeature ? shouldEnableFeature('animations') : false}
            className="portfolio-item touch-target"
            style={{
              scrollSnapAlign: 'start',
              // Ensure proper touch target size
              minHeight: '44px',
              minWidth: '44px',
              padding: '12px',
            }}
            whileTap={shouldEnableFeature && shouldEnableFeature('animations') ? { scale: 0.98 } : undefined}
            onClick={() => handleItemClick(item, index)}
          >
            {visibleItems.has(String(item.id)) ? (
              <PortfolioItem 
                item={{
                  ...item,
                  ...getImageProps(item)
                }} 
                onItemClick={() => handleItemClick(item, index)} 
                lang={lang}
              />
            ) : (
              // Placeholder while loading
              <div 
                className="portfolio-item-placeholder relative overflow-hidden"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: '#f0f0f0',
                  borderRadius: '8px',
                }}
              >
                {animationSettings.animate && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      animation: 'shimmer-once 1.5s ease-out forwards',
                    }}
                  />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// CSS for the shimmer animation (should be in a separate CSS file)
const styles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .portfolio-grid.touch-friendly {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
  }

  @media (max-width: 768px) {
    .portfolio-grid.touch-friendly {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0.5rem;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .portfolio-grid.touch-friendly {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .portfolio-grid.no-animations * {
    animation: none !important;
    transition: none !important;
  }

  .portfolio-item.touch-target {
    cursor: pointer;
    position: relative;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .portfolio-item.touch-target:active {
    opacity: 0.8;
  }

  @media (hover: hover) and (pointer: fine) {
    .portfolio-item.touch-target:hover {
      transform: translateY(-2px);
      transition: transform 0.2s ease-out;
    }
  }

  .portfolio-item-placeholder {
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .portfolio-grid * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Export styles for inclusion in the page
export const portfolioGridStyles = styles;