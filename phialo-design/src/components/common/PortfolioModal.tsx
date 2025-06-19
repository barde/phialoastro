import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PortfolioItem {
  title: string;
  description: string;
  category: string;
  image: string;
  gallery?: string[];
  materials?: string[];
  client?: string;
  projectDate?: string;
  availability?: string;
  price?: string;
  tags?: string[];
}

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioItem: PortfolioItem;
}

export default function PortfolioModal({ isOpen, onClose, portfolioItem }: PortfolioModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all images (main image + gallery)
  const allImages = portfolioItem.gallery?.length 
    ? portfolioItem.gallery 
    : [portfolioItem.image];
  
  const hasMultipleImages = allImages.length > 1;

  // Handle keyboard events
  useEffect(() => {
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
  }, [isOpen, onClose, hasMultipleImages, currentImageIndex]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      const previouslyFocused = document.activeElement as HTMLElement;
      
      // Focus the close button
      setTimeout(() => {
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
        document.removeEventListener('keydown', handleTabKey);
        // Restore focus when modal closes
        previouslyFocused?.focus();
      };
    }
  }, [isOpen]);

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

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    } else {
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-midnight/90 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal container */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 backdrop-blur-sm rounded-full transition-colors duration-200 shadow-lg"
              style={{ 
                backgroundColor: 'rgba(var(--color-bg-primary-rgb), 0.9)',
                color: 'var(--color-text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--color-bg-primary-rgb), 0.9)'}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {/* Content container */}
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Image section */}
              <div className="relative flex-1 flex items-center justify-center p-8 lg:p-12" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                {/* Main image */}
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={allImages[currentImageIndex]}
                  alt={portfolioItem.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />

                {/* Gallery navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 backdrop-blur-sm rounded-full transition-colors duration-200 shadow-lg"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-bg-primary-rgb), 0.9)',
                        color: 'var(--color-text-primary)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--color-bg-primary-rgb), 0.9)'}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 backdrop-blur-sm rounded-full transition-colors duration-200 shadow-lg"
                      style={{ 
                        backgroundColor: 'rgba(var(--color-bg-primary-rgb), 0.9)',
                        color: 'var(--color-text-primary)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--color-bg-primary-rgb), 0.9)'}
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>

                    {/* Image indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'w-8'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: index === currentImageIndex 
                              ? 'var(--color-secondary)' 
                              : 'var(--color-gray-400)'
                          }}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Details section */}
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {/* Category badge */}
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-4 uppercase tracking-wider" style={{ backgroundColor: 'rgba(var(--color-secondary), 0.1)', color: 'var(--color-secondary)' }}>
                    {portfolioItem.category}
                  </span>

                  {/* Title */}
                  <h2 id="modal-title" className="font-display text-3xl md:text-4xl font-light mb-6" style={{ color: 'var(--color-text-primary)' }}>
                    {portfolioItem.title}
                  </h2>

                  {/* Description */}
                  <div className="prose prose-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                    <p>{portfolioItem.description}</p>
                  </div>

                  {/* Details grid */}
                  <div className="space-y-6">
                    {/* Materials */}
                    {portfolioItem.materials && portfolioItem.materials.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Materials</h3>
                        <div className="flex flex-wrap gap-2">
                          {portfolioItem.materials.map((material, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 text-sm rounded-full"
                              style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
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
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Client</h4>
                          <p style={{ color: 'var(--color-text-primary)' }}>{portfolioItem.client}</p>
                        </div>
                      )}
                      {portfolioItem.projectDate && (
                        <div>
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Project Date</h4>
                          <p style={{ color: 'var(--color-text-primary)' }}>{portfolioItem.projectDate}</p>
                        </div>
                      )}
                      {portfolioItem.availability && (
                        <div>
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Availability</h4>
                          <p className="capitalize" style={{ color: 'var(--color-text-primary)' }}>{portfolioItem.availability}</p>
                        </div>
                      )}
                      {portfolioItem.price && (
                        <div>
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Price</h4>
                          <p style={{ color: 'var(--color-text-primary)' }}>{portfolioItem.price}</p>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {portfolioItem.tags && portfolioItem.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {portfolioItem.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs border rounded"
                              style={{ 
                                color: 'var(--color-text-secondary)', 
                                borderColor: 'var(--color-gray-300)' 
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}