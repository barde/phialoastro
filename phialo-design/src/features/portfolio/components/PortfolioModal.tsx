import { useEffect, useRef, useState, useCallback } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { YouTubeEmbed } from './YouTubeEmbed';
import OptimizedPicture from '../../../shared/components/OptimizedPicture';

import type { PortfolioItemData } from './PortfolioSection';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItem: PortfolioItemData;
  lang?: 'en' | 'de';
}

export default function PortfolioModal({ isOpen, onClose, portfolioItem, lang = 'de' }: PortfolioModalProps) {
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
    // Add any other categories that might exist
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

  // Navigation function needs to be stable for useEffect dependencies
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
    if (!isHydrated) return; // Skip until hydrated
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultipleImages) {
            navigateImage('prev');
          }
          break;
        case 'ArrowRight':
          if (hasMultipleImages) {
            navigateImage('next');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasMultipleImages, navigateImage, isHydrated]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setImageLoading(true);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (!isHydrated || !isOpen) return; // Skip until hydrated and open
    
    // Save current focus
    const previouslyFocused = document.activeElement as HTMLElement;
    
    // Focus the close button
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Trap focus within modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleTabKey);
      // Restore focus when modal closes
      previouslyFocused?.focus();
    };
  }, [isOpen, isHydrated]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isHydrated) return; // Skip until hydrated
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isHydrated]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle embed URLs
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];
    
    // Handle regular YouTube URLs
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Handle short URLs
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  };

  // Determine if we have a video (either youtubeVideoId or videoUrl)
  const videoId = portfolioItem.youtubeVideoId || (portfolioItem.videoUrl ? getYouTubeVideoId(portfolioItem.videoUrl) : null);
  const hasVideo = !!videoId;
  
  // For backward compatibility, if aspectRatio is not specified but we have a videoUrl, assume 16:9
  const videoAspectRatio = portfolioItem.youtubeAspectRatio || '16:9';

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8"
          onClick={handleOverlayClick}
          aria-modal="true"
          aria-labelledby="modal-title"
          role="dialog"
        >
          {/* Overlay background */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-midnight/90 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
            data-testid="modal-backdrop"
          />

          {/* Modal container */}
          <m.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="portfolio-modal"
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
              aria-label={t.closeModal}
              data-testid="modal-close"
            >
              <X size={24} className="text-gray-700" />
            </button>

            {/* Content container */}
            <div className="flex flex-col lg:flex-row max-h-[90vh]">
              {/* Image section */}
              <div className="relative flex-1 bg-gray-100 flex items-center justify-center">
                {/* Loading spinner */}
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gold rounded-full animate-spin" />
                  </div>
                )}
                
                {/* Main image */}
                <m.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoading ? 0 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <OptimizedPicture
                    src={allImages[currentImageIndex]}
                    alt={portfolioItem.title}
                    className="w-full h-full object-contain"
                    loading="eager"
                    fetchPriority="high"
                    width={1200}
                    height={900}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </m.div>

                {/* Gallery navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
                      aria-label={t.previousImage}
                    >
                      <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200 shadow-lg"
                      aria-label={t.nextImage}
                    >
                      <ChevronRight size={24} className="text-gray-700" />
                    </button>

                    {/* Image indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'bg-gold w-8'
                              : 'bg-gray-400 hover:bg-gray-600'
                          }`}
                          aria-label={`${t.goToImage} ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Details section */}
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {/* Category badge */}
                  <span className="inline-block px-3 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full mb-4 uppercase tracking-wider">
                    {isEnglish && categoryTranslations[portfolioItem.category] 
                      ? categoryTranslations[portfolioItem.category] 
                      : portfolioItem.category}
                  </span>

                  {/* Title */}
                  <h2 id="modal-title" className="font-display text-3xl md:text-4xl font-light text-midnight mb-6">
                    {portfolioItem.title}
                  </h2>

                  {/* Description with year */}
                  <div className="prose prose-lg text-gray-600 mb-8">
                    <p>{portfolioItem.description}</p>
                    {portfolioItem.year && (
                      <p className="mt-2 text-sm text-gray-500">
                        {isEnglish ? 'Created in' : 'Erstellt'} {portfolioItem.year}
                      </p>
                    )}
                  </div>

                  {/* Determine layout based on video aspect ratio */}
                  {hasVideo ? (
                    videoAspectRatio === '9:16' ? (
                      /* Vertical video (9:16) - show side by side with text */
                      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                        {/* Text content - left side */}
                        <div className="space-y-6">
                        {/* Materials */}
                        {portfolioItem.materials && portfolioItem.materials.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-midnight mb-2">{t.materials}</h3>
                            <div className="flex flex-wrap gap-2">
                              {portfolioItem.materials.map((material, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                                >
                                  {material}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {portfolioItem.client && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.client}</h4>
                              <p className="text-midnight">{portfolioItem.client}</p>
                            </div>
                          )}
                          {portfolioItem.projectDate && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.projectDate}</h4>
                              <p className="text-midnight">{portfolioItem.projectDate}</p>
                            </div>
                          )}
                          {portfolioItem.availability && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.availability}</h4>
                              <p className="text-midnight capitalize">
                                {availabilityTranslations[portfolioItem.availability] || portfolioItem.availability}
                              </p>
                            </div>
                          )}
                          {portfolioItem.price && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.price}</h4>
                              <p className="text-midnight">{portfolioItem.price}</p>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {portfolioItem.tags && portfolioItem.tags.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-midnight mb-2">{t.tags}</h3>
                            <div className="flex flex-wrap gap-2">
                              {portfolioItem.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                        {/* YouTube Video - right side for vertical videos */}
                        <div className="mt-6 lg:mt-0">
                          <YouTubeEmbed 
                            videoId={videoId}
                            title={`${portfolioItem.title} ${isEnglish ? 'Video' : 'Video'}`}
                            aspectRatio={videoAspectRatio}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Horizontal video (16:9) - show below text in full width */
                      <div className="space-y-6">
                        {/* Materials */}
                        {portfolioItem.materials && portfolioItem.materials.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-midnight mb-2">{t.materials}</h3>
                            <div className="flex flex-wrap gap-2">
                              {portfolioItem.materials.map((material, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                                >
                                  {material}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {portfolioItem.client && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.client}</h4>
                              <p className="text-midnight">{portfolioItem.client}</p>
                            </div>
                          )}
                          {portfolioItem.projectDate && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.projectDate}</h4>
                              <p className="text-midnight">{portfolioItem.projectDate}</p>
                            </div>
                          )}
                          {portfolioItem.availability && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.availability}</h4>
                              <p className="text-midnight capitalize">
                                {availabilityTranslations[portfolioItem.availability] || portfolioItem.availability}
                              </p>
                            </div>
                          )}
                          {portfolioItem.price && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">{t.price}</h4>
                              <p className="text-midnight">{portfolioItem.price}</p>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {portfolioItem.tags && portfolioItem.tags.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-midnight mb-2">{t.tags}</h3>
                            <div className="flex flex-wrap gap-2">
                              {portfolioItem.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* YouTube Video - below text for horizontal videos */}
                        <div className="mt-6">
                          <YouTubeEmbed 
                            videoId={videoId}
                            title={`${portfolioItem.title} ${isEnglish ? 'Video' : 'Video'}`}
                            aspectRatio={videoAspectRatio}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    /* Original layout without video */
                    <div className="space-y-6">
                      {/* Materials */}
                      {portfolioItem.materials && portfolioItem.materials.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-midnight mb-2">{t.materials}</h3>
                          <div className="flex flex-wrap gap-2">
                            {portfolioItem.materials.map((material, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portfolioItem.client && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">{t.client}</h4>
                            <p className="text-midnight">{portfolioItem.client}</p>
                          </div>
                        )}
                        {portfolioItem.projectDate && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">{t.projectDate}</h4>
                            <p className="text-midnight">{portfolioItem.projectDate}</p>
                          </div>
                        )}
                        {portfolioItem.availability && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">{t.availability}</h4>
                            <p className="text-midnight capitalize">
                              {availabilityTranslations[portfolioItem.availability] || portfolioItem.availability}
                            </p>
                          </div>
                        )}
                        {portfolioItem.price && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">{t.price}</h4>
                            <p className="text-midnight">{portfolioItem.price}</p>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {portfolioItem.tags && portfolioItem.tags.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-midnight mb-2">{t.tags}</h3>
                          <div className="flex flex-wrap gap-2">
                            {portfolioItem.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </m.div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
      </AnimatePresence>
    </LazyMotion>
  );
}