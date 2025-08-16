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
  // Extract filename without extension and path
  const filename = src.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  const basePath = src.substring(0, src.lastIndexOf('/'));
  
  // Generate srcset for different sizes
  const generateSrcSet = (ext: string) => {
    return `
      ${basePath}/${filename}-400w.${ext} 400w,
      ${basePath}/${filename}-800w.${ext} 800w,
      ${basePath}/${filename}-1200w.${ext} 1200w,
      ${basePath}/${filename}.${ext} 1600w
    `.trim().replace(/\s+/g, ' ');
  };
  
  // Sizes for responsive images - more accurate for portfolio grid
  const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 320px';
  
  // Use Cloudflare's image resizing API with adaptive quality
  // Higher quality for critical images, lower for below-fold
  const quality = loading === 'eager' && fetchPriority === 'high' ? 90 : 85;
  const cfOptimizedSrc = `${src}?format=auto&quality=${quality}&width=${width}`;
  
  // Create more granular srcset for better mobile performance
  const cfSrcSet = `
    ${src}?format=auto&quality=75&width=320 320w,
    ${src}?format=auto&quality=80&width=400 400w,
    ${src}?format=auto&quality=80&width=640 640w,
    ${src}?format=auto&quality=85&width=800 800w,
    ${src}?format=auto&quality=85&width=1024 1024w,
    ${src}?format=auto&quality=85&width=1200 1200w,
    ${src}?format=auto&quality=90&width=1600 1600w,
    ${src}?format=auto&quality=90&width=2000 2000w
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <picture>
      {/* Modern format with Cloudflare auto-format */}
      <source
        srcSet={cfSrcSet}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback to original */}
      <img
        src={cfOptimizedSrc}
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