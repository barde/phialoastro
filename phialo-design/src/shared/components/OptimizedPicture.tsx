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
 * Optimized picture component that works with Astro's build-time image optimization
 * Note: For best results, use Astro's Image component directly in .astro files
 * This component is for React islands where Astro components can't be used
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
  // For now, we'll use the original images
  // In production, Astro will serve optimized versions automatically
  // when images are imported through Astro components
  
  // Sizes for responsive images
  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  return (
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
  );
}