import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { YouTubeEmbed } from './YouTubeEmbed';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    slug: string;
    title: string;
    description: string;
    images: string[];
    tags?: string[];
    features?: string[];
    materials?: string[];
    youtube?: string;
  } | null;
  language: 'de' | 'en';
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasNavigation?: boolean;
}

/**
 * CSS-only version of PortfolioModal without Framer Motion
 * Uses CSS transitions and animations for all effects
 * Reduces bundle size by ~30KB
 */
export default function PortfolioModalCSS({ 
  isOpen, 
  onClose, 
  item, 
  language,
  onNavigate,
  hasNavigation = true
}: PortfolioModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Reset image index when item changes
  useEffect(() => {
    if (item) {
      setCurrentImageIndex(0);
    }
  }, [item?.slug]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match CSS transition duration
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      handleClose();
    }
  }, [handleClose]);

  const handlePrevImage = useCallback(() => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    }
  }, [item]);

  const handleNextImage = useCallback(() => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === item.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [item]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrevImage();
      } else {
        handleNextImage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [handlePrevImage, handleNextImage]);

  if (!isOpen || !item) return null;

  const labels = {
    de: {
      close: 'Schließen',
      prev: 'Vorheriges Bild',
      next: 'Nächstes Bild',
      prevItem: 'Vorheriges Projekt',
      nextItem: 'Nächstes Projekt',
      features: 'Eigenschaften',
      materials: 'Materialien',
      tags: 'Tags'
    },
    en: {
      close: 'Close',
      prev: 'Previous image',
      next: 'Next image',
      prevItem: 'Previous project',
      nextItem: 'Next project',
      features: 'Features',
      materials: 'Materials',
      tags: 'Tags'
    }
  };

  const t = labels[language];

  return (
    <div 
      ref={modalRef}
      className={`portfolio-modal ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        ref={contentRef}
        className="portfolio-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="portfolio-modal-close"
          aria-label={t.close}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation arrows */}
        {hasNavigation && (
          <>
            <button
              onClick={() => onNavigate?.('prev')}
              className="portfolio-modal-nav portfolio-modal-nav-prev"
              aria-label={t.prevItem}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() => onNavigate?.('next')}
              className="portfolio-modal-nav portfolio-modal-nav-next"
              aria-label={t.nextItem}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="portfolio-modal-inner">
          {/* Image carousel */}
          <div className="portfolio-modal-images">
            {item.youtube ? (
              <YouTubeEmbed 
                videoId={item.youtube} 
                title={item.title}
              />
            ) : item.images.length > 0 ? (
              <>
                <div className="portfolio-modal-image-container">
                  <img
                    src={item.images[currentImageIndex]}
                    alt={`${item.title} - ${currentImageIndex + 1}`}
                    className="portfolio-modal-image"
                  />
                </div>
                
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="portfolio-modal-image-nav portfolio-modal-image-nav-prev"
                      aria-label={t.prev}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="portfolio-modal-image-nav portfolio-modal-image-nav-next"
                      aria-label={t.next}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Image dots indicator */}
                    <div className="portfolio-modal-dots">
                      {item.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`portfolio-modal-dot ${index === currentImageIndex ? 'active' : ''}`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>

          {/* Content */}
          <div className="portfolio-modal-details">
            <h2 className="portfolio-modal-title">{item.title}</h2>
            <p className="portfolio-modal-description">{item.description}</p>
            
            {/* Features */}
            {item.features && item.features.length > 0 && (
              <div className="portfolio-modal-section">
                <h3>{t.features}</h3>
                <ul>
                  {item.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Materials */}
            {item.materials && item.materials.length > 0 && (
              <div className="portfolio-modal-section">
                <h3>{t.materials}</h3>
                <div className="portfolio-modal-materials">
                  {item.materials.map((material, index) => (
                    <span key={index} className="portfolio-modal-material">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="portfolio-modal-section">
                <h3>{t.tags}</h3>
                <div className="portfolio-modal-tags">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="portfolio-modal-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .portfolio-modal {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.75);
          animation: fadeIn 0.3s ease-out;
        }

        .portfolio-modal.closing {
          animation: fadeOut 0.3s ease-out;
        }

        .portfolio-modal-content {
          position: relative;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }

        .closing .portfolio-modal-content {
          animation: slideDown 0.3s ease-out;
        }

        .portfolio-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          background: white;
          border-radius: 0.25rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .portfolio-modal-close:hover {
          background: #f3f4f6;
          transform: scale(1.05);
        }

        .portfolio-modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          padding: 0.5rem;
          background: white;
          border-radius: 0.25rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .portfolio-modal-nav:hover {
          background: #f3f4f6;
          transform: translateY(-50%) scale(1.05);
        }

        .portfolio-modal-nav-prev {
          left: 1rem;
        }

        .portfolio-modal-nav-next {
          right: 1rem;
        }

        .portfolio-modal-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .portfolio-modal-images {
          position: relative;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portfolio-modal-image-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portfolio-modal-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .portfolio-modal-image-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .portfolio-modal-image-nav:hover {
          background: white;
          transform: translateY(-50%) scale(1.05);
        }

        .portfolio-modal-image-nav-prev {
          left: 1rem;
        }

        .portfolio-modal-image-nav-next {
          right: 1rem;
        }

        .portfolio-modal-dots {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
        }

        .portfolio-modal-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.2s;
        }

        .portfolio-modal-dot.active {
          background: white;
          transform: scale(1.2);
        }

        .portfolio-modal-details {
          padding: 2rem;
          overflow-y: auto;
        }

        .portfolio-modal-title {
          font-size: 1.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .portfolio-modal-description {
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .portfolio-modal-section {
          margin-bottom: 1.5rem;
        }

        .portfolio-modal-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .portfolio-modal-section ul {
          list-style: disc;
          padding-left: 1.5rem;
          color: #6b7280;
        }

        .portfolio-modal-materials,
        .portfolio-modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .portfolio-modal-material,
        .portfolio-modal-tag {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          border-radius: 9999px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(1rem);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .portfolio-modal-inner {
            grid-template-columns: 1fr;
          }

          .portfolio-modal-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}