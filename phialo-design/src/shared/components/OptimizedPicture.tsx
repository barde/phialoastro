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
  
  // Check if this is a profile image
  const isProfileImage = src.includes('portrait');
  
  // Sizes for responsive images - more accurate for portfolio grid
  const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 320px';
  
  // Generate srcset for different formats
  const generateSrcSet = (ext: string, includeLarge: boolean = true) => {
    let sizesArray: number[];
    if (isProfileImage) {
      // Use smaller sizes for profile images
      sizesArray = [200, 400, 600, 800, 1200];
    } else {
      sizesArray = includeLarge 
        ? [320, 400, 640, 800, 1024, 1200, 1600, 2000]
        : [320, 400, 640, 800];
    }
    
    // AVIF is only generated for sizes >= 800px to save build time (except for profiles)
    const filteredSizes = (ext === 'avif' && !isProfileImage)
      ? sizesArray.filter(s => s >= 800) 
      : sizesArray;
    
    return filteredSizes
      .map(size => `${basePath}/${filename}-${size}w.${ext} ${size}w`)
      .join(', ');
  };
  
  // Check if we have modern formats available
  const hasModernFormats = !src.includes('http') || src.includes('phialo');
  
  // For now, just return a simple img tag since picture element isn't working
  // We'll use direct WebP URLs when available
  const webpSrc = hasModernFormats && filename 
    ? `${basePath}/${filename}-${isProfileImage ? '400' : '800'}w.webp`
    : src;
  
  return (
    <img
      src={webpSrc}
      srcSet={hasModernFormats ? generateSrcSet('webp') : undefined}
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
  );
}