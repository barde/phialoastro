import { useEffect, useRef, useState, useCallback } from 'react';
import { m, AnimatePresence } from '../../../lib/framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { YouTubeEmbed } from './YouTubeEmbed';
import MotionProvider from '../../../shared/components/providers/MotionProvider';

import type { PortfolioItemData } from './PortfolioSection';

interface PortfolioModalOptimizedProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItem: PortfolioItemData;
  lang?: 'en' | 'de';
}

/**
 * Inner component that uses motion components
 */
function PortfolioModalContent({ 
  isOpen, 
  onClose, 
  portfolioItem, 
  lang = 'de' 
}: PortfolioModalOptimizedProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Use the language prop directly - no client-side detection needed
  const isEnglish = lang === 'en';

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Translations
  const translations = {
    de: {
      closeModal: 'Modal schließen',
      previousImage: 'Vorheriges Bild',
      nextImage: 'Nächstes Bild',
      goToImage: 'Zu Bild',
      materials: 'Materialien',
      client: 'Kunde',
      projectDate: 'Projektdatum',
      availability: 'Verfügbarkeit',
      price: 'Preis',
      tags: 'Tags'
    },
    en: {
      closeModal: 'Close modal',
      previousImage: 'Previous image',
      nextImage: 'Next image',
      goToImage: 'Go to image',
      materials: 'Materials',
      client: 'Client',
      projectDate: 'Project Date',
      availability: 'Availability',
      price: 'Price',
      tags: 'Tags'
    }
  };

  // Category translations
  const categoryTranslations: { [key: string]: string } = {
    'Ringe': 'Rings',
    'Ohrringe': 'Earrings',
    'Anhänger': 'Pendants',
    'Skulpturen': 'Sculptures',
    'Anstecker': 'Pins',
    'Schmuck': 'Jewelry',
    '3D Design': '3D Design'
  };

  // Availability translations
  const availabilityTranslations: { [key: string]: string } = {
    'available': isEnglish ? 'Available' : 'Verfügbar',
    'custom': isEnglish ? 'Custom Order' : 'Auf Bestellung',
    'sold': isEnglish ? 'Sold' : 'Verkauft',
    'exhibition': isEnglish ? 'Exhibition Only' : 'Nur Ausstellung'
  };

  const t = isEnglish ? translations.en : translations.de;
  
  // Get all images (main image + gallery)
  const allImages = portfolioItem.gallery?.length 
    ? portfolioItem.gallery 
    : [portfolioItem.image];
  
  const hasMultipleImages = allImages.length > 1;

  // Navigation function
  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    setImageLoading(true);
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    } else {
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    }
  }, [allImages.length]);

  // Handle keyboard events
  useEffect(() => {
    if (!isHydrated || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        navigateImage('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Trap focus in modal
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHydrated, isOpen, onClose, hasMultipleImages, navigateImage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isHydrated) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - using m component */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - using m component */}
          <m.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
              aria-label={t.closeModal}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image section */}
            <div className="w-full md:w-3/5 lg:w-2/3 bg-black relative flex items-center justify-center">
              {/* Image navigation */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 z-10 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                    aria-label={t.previousImage}
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 z-10 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                    aria-label={t.nextImage}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Loading state */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Main image */}
              <img
                src={allImages[currentImageIndex]}
                alt={portfolioItem.title}
                className={`max-w-full max-h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={() => setImageLoading(false)}
              />

              {/* Image indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setImageLoading(true);
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                      aria-label={`${t.goToImage} ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content section */}
            <div className="w-full md:w-2/5 lg:w-1/3 p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-playfair mb-2">{portfolioItem.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isEnglish && categoryTranslations[portfolioItem.category] 
                  ? categoryTranslations[portfolioItem.category] 
                  : portfolioItem.category}
              </p>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {portfolioItem.description}
              </p>

              {/* Materials */}
              {portfolioItem.materials && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.materials}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{portfolioItem.materials}</p>
                </div>
              )}

              {/* Client */}
              {portfolioItem.client && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.client}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{portfolioItem.client}</p>
                </div>
              )}

              {/* Project Date */}
              {portfolioItem.projectDate && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.projectDate}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{portfolioItem.projectDate}</p>
                </div>
              )}

              {/* Availability */}
              {portfolioItem.availability && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.availability}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {availabilityTranslations[portfolioItem.availability] || portfolioItem.availability}
                  </p>
                </div>
              )}

              {/* Price */}
              {portfolioItem.price && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.price}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{portfolioItem.price}</p>
                </div>
              )}

              {/* Tags */}
              {portfolioItem.tags && portfolioItem.tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">{t.tags}</h3>
                  <div className="flex flex-wrap gap-2">
                    {portfolioItem.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Video */}
              {portfolioItem.videoUrl && (
                <div className="mt-6">
                  <YouTubeEmbed videoUrl={portfolioItem.videoUrl} title={portfolioItem.title} />
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Optimized PortfolioModal with LazyMotion wrapper
 * Reduces Framer Motion bundle impact significantly
 */
export default function PortfolioModalOptimized(props: PortfolioModalOptimizedProps) {
  return (
    <MotionProvider features="basic">
      <PortfolioModalContent {...props} />
    </MotionProvider>
  );
}