import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  lang?: 'en' | 'de';
  showBadge?: boolean;
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = '1/1',
  objectFit = 'cover',
  lang = 'de',
  showBadge = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use the language prop directly
  const isEnglish = lang === 'en';

  // Translations
  const qualityBadge = isEnglish ? 'Handcrafted' : 'Handgefertigt';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if image is already loaded (from cache)
  useEffect(() => {
    if (isInView && imgRef.current) {
      if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, [isInView, src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Placeholder background - always visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />

      {/* Actual image with slide-in effect */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out ${
            objectFit === 'cover' ? 'object-cover' :
            objectFit === 'contain' ? 'object-contain' :
            objectFit === 'fill' ? 'object-fill' :
            objectFit === 'none' ? 'object-none' :
            'object-scale-down'
          } ${
            isLoaded 
              ? 'translate-x-0 scale-100 opacity-100' 
              : 'translate-x-4 scale-95 opacity-0'
          }`}
          loading="lazy"
        />
      )}

      {/* Quality badge overlay */}
      {showBadge && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gold bg-white/90 backdrop-blur-sm rounded-full">
            {qualityBadge}
          </span>
        </div>
      )}
    </div>
  );
}
