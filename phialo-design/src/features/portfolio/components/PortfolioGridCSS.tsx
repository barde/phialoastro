import React, { useCallback, useState } from 'react';
import type { PortfolioItemData } from './PortfolioSection';

interface PortfolioGridCSSProps {
  items: PortfolioItemData[];
  onItemClick?: (item: PortfolioItemData) => void;
  lang?: 'en' | 'de';
}

/**
 * CSS-only version of PortfolioGrid without Framer Motion
 * Uses CSS animations for all hover and transition effects
 */
export default function PortfolioGridCSS({ 
  items, 
  onItemClick,
  lang = 'de' 
}: PortfolioGridCSSProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((slug: string) => {
    setLoadedImages(prev => new Set(prev).add(slug));
  }, []);

  const handleItemClick = useCallback((item: PortfolioItemData) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  const labels = {
    de: {
      viewDetails: 'Details anzeigen'
    },
    en: {
      viewDetails: 'View details'
    }
  };

  const t = labels[lang];

  return (
    <div className="portfolio-grid">
      {items.map((item, index) => (
        <div
          key={item.slug}
          className={`portfolio-item ${loadedImages.has(item.slug) ? 'loaded' : ''}`}
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => handleItemClick(item)}
          data-item-id={item.id}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick(item);
            }
          }}
          aria-label={`${item.title} - ${t.viewDetails}`}
        >
          <div className="portfolio-item-inner">
            <div className="portfolio-item-image-wrapper">
              <img
                src={item.image}
                alt={item.title}
                className="portfolio-item-image"
                loading="lazy"
                onLoad={() => handleImageLoad(item.slug)}
              />
              <div className="portfolio-item-overlay">
                <div className="portfolio-item-overlay-content">
                  <h3 className="portfolio-item-title">{item.title}</h3>
                  <p className="portfolio-item-category">{item.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .portfolio-grid {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          }
        }

        .portfolio-item {
          position: relative;
          cursor: pointer;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.6s ease-out forwards;
          transition: transform 0.3s ease;
        }

        .portfolio-item.loaded {
          opacity: 1;
        }

        .portfolio-item:hover {
          transform: translateY(-5px);
        }

        .portfolio-item-inner {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 0.5rem;
          background: #f9fafb;
        }

        .portfolio-item-image-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 125%; /* 4:5 aspect ratio */
          overflow: hidden;
        }

        .portfolio-item-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .portfolio-item:hover .portfolio-item-image {
          transform: scale(1.1);
        }

        .portfolio-item-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          padding: 1.5rem;
        }

        .portfolio-item:hover .portfolio-item-overlay {
          opacity: 1;
        }

        .portfolio-item-overlay-content {
          color: white;
          transform: translateY(10px);
          transition: transform 0.3s ease;
        }

        .portfolio-item:hover .portfolio-item-overlay-content {
          transform: translateY(0);
        }

        .portfolio-item-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .portfolio-item-category {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .portfolio-item {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .portfolio-item:hover {
            transform: none;
          }

          .portfolio-item-image,
          .portfolio-item-overlay,
          .portfolio-item-overlay-content {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}