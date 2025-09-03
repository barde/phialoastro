import { useState, useEffect } from 'react';
import OptimizedPicture from '../../../shared/components/OptimizedPicture';

interface TeamMemberImageProps {
  primaryImage: string;
  hoverImage: string;
  alt: string;
  className?: string;
}

export default function TeamMemberImage({ 
  primaryImage, 
  hoverImage, 
  alt, 
  className = '' 
}: TeamMemberImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  
  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Preload hover image for smooth transition
  useEffect(() => {
    if (!isHydrated) return;
    
    const preloadImage = new Image();
    preloadImage.src = hoverImage;
    
    // Set as loaded immediately for better UX
    // The image will still load in background
    setImagesPreloaded(true);
    
    preloadImage.onload = () => {
      // Image is cached now for smooth transition
      setImagesPreloaded(true);
    };
    
    // Even on error, allow hover functionality
    preloadImage.onerror = () => {
      setImagesPreloaded(true);
    };
    
    return () => {
      preloadImage.onload = null;
      preloadImage.onerror = null;
    };
  }, [hoverImage, isHydrated]);
  
  // Keyboard accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsHovered(!isHovered);
    }
  };
  
  return (
    <div 
      className="group relative focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${alt} - Press Enter to toggle alternate image`}
    >
      {/* Primary image (always rendered for SEO) */}
      <div className={`transition-all duration-500 ease-luxury ${
        isHydrated && isHovered && imagesPreloaded ? 'opacity-0' : 'opacity-100'
      }`}>
        <OptimizedPicture
          src={primaryImage}
          alt={alt}
          className={className}
          loading="lazy"
          width={600}
          height={600}
        />
      </div>
      
      {/* Hover image (only renders after hydration and preload) */}
      {isHydrated && imagesPreloaded && (
        <div className={`absolute inset-0 transition-all duration-500 ease-luxury ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!isHovered}>
          <OptimizedPicture
            src={hoverImage}
            alt={`${alt} - alternate view`}
            className={className}
            loading="eager"
            width={400}
            height={400}
          />
        </div>
      )}
      
      {/* Easter egg hint - subtle icon that appears on hover */}
      {isHydrated && imagesPreloaded && (
        <div 
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
            <svg 
              className="w-5 h-5 text-gold" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* Preload link tag for better performance */}
      {isHydrated && (
        <link rel="preload" as="image" href={hoverImage} />
      )}
    </div>
  );
}