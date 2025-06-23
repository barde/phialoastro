import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3C/svg%3E', // Simple gray placeholder
  aspectRatio = '1/1',
  objectFit = 'cover'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Language detection
  useEffect(() => {
    setIsEnglish(window.location.pathname.startsWith('/en/'));
  }, []);

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

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Placeholder background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-platinum to-gray-100 transition-opacity duration-700 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Shimmer effect while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`absolute inset-0 w-full h-full transition-all duration-700 ${
            objectFit === 'cover' ? 'object-cover' :
            objectFit === 'contain' ? 'object-contain' :
            objectFit === 'fill' ? 'object-fill' :
            objectFit === 'none' ? 'object-none' :
            'object-scale-down'
          } ${
            isLoaded 
              ? 'opacity-100 scale-100 filter-none' 
              : 'opacity-0 scale-105 filter-blur-sm'
          }`}
          loading="lazy"
        />
      )}

      {/* Quality badge overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gold bg-white/90 backdrop-blur-sm rounded-full">
          {qualityBadge}
        </span>
      </div>
    </div>
  );
}
