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
  
  // Sizes for responsive images - optimized for portfolio grid performance
  // Updated to better match actual display sizes and reduce oversized image selection
  const sizes = isProfileImage 
    ? '(max-width: 640px) 200px, (max-width: 1024px) 300px, 400px'
    : '(max-width: 640px) 100vw, (max-width: 768px) 384px, (max-width: 1024px) 340px, (max-width: 1280px) 310px, 400px';
  
  // Generate srcset for different formats - prioritize faster loading for critical images
  const generateSrcSet = (ext: string, includeLarge: boolean = true) => {
    let sizesArray: number[];
    if (isProfileImage) {
      // Use smaller sizes for profile images
      sizesArray = [200, 400, 600, 800, 1200];
    } else {
      // For portfolio images, prioritize commonly used sizes for faster loading
      sizesArray = includeLarge 
        ? [320, 640, 800, 1200, 1600] // Removed redundant sizes to reduce network overhead
        : [320, 640, 800];
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
  
  // Choose optimal image size based on priority - smaller for faster LCP and better matching actual display size
  const optimalSize = fetchPriority === 'high' && loading === 'eager' 
    ? (isProfileImage ? '400' : '640') // Use smaller size for LCP images to load faster
    : (isProfileImage ? '400' : '640'); // Changed from 800 to 640 to better match typical display sizes
    
  // Use direct WebP URLs when available with optimal sizing
  const webpSrc = hasModernFormats && filename 
    ? `${basePath}/${filename}-${optimalSize}w.webp`
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
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}