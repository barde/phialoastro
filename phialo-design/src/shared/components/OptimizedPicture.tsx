import React from 'react';

interface OptimizedPictureProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized picture component that provides modern image formats
 * Uses picture element with WebP/AVIF sources for better compression
 */
export default function OptimizedPicture({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority,
  width = 800,
  height = 1000,
  onLoad,
  onError,
}: OptimizedPictureProps) {
  // Extract filename without extension
  const filename = src.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  const basePath = src.substring(0, src.lastIndexOf('/'));
  
  // Sizes for responsive images - more accurate for portfolio grid
  const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 320px';
  
  // Generate srcset for different formats
  const generateSrcSet = (ext: string, includeLarge: boolean = true) => {
    const sizes = includeLarge 
      ? [320, 400, 640, 800, 1024, 1200, 1600, 2000]
      : [320, 400, 640, 800];
    
    return sizes
      .map(size => `${basePath}/${filename}-${size}w.${ext} ${size}w`)
      .join(', ');
  };
  
  // Check if we have modern formats available
  const hasModernFormats = !src.includes('http') || src.includes('phialo');
  
  return (
    <picture>
      {/* AVIF for browsers that support it (best compression) */}
      {hasModernFormats && (
        <source
          srcSet={generateSrcSet('avif', false)}
          sizes={sizes}
          type="image/avif"
        />
      )}
      
      {/* WebP for broader support */}
      {hasModernFormats && (
        <source
          srcSet={generateSrcSet('webp')}
          sizes={sizes}
          type="image/webp"
        />
      )}
      
      {/* Fallback to JPEG */}
      <source
        srcSet={`
          ${src} 1600w,
          ${basePath}/${filename}.jpg 1600w
        `.trim()}
        sizes={sizes}
        type="image/jpeg"
      />
      
      {/* Fallback img element */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        onLoad={onLoad}
        onError={onError}
        decoding={loading === 'eager' ? 'sync' : 'async'}
        sizes={sizes}
      />
    </picture>
  );
}