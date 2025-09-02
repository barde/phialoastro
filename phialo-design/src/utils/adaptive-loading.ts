/**
 * Adaptive Loading utility for optimizing resource loading based on device capabilities
 * and network conditions
 */

interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export class AdaptiveLoader {
  private connection: NetworkInformation | undefined;
  private memory: number | undefined;
  private cores: number | undefined;

  constructor() {
    const nav = navigator as NavigatorWithConnection;
    this.connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    this.memory = (navigator as any).deviceMemory;
    this.cores = navigator.hardwareConcurrency;
  }

  /**
   * Get the current network speed
   */
  getNetworkSpeed(): 'slow' | 'medium' | 'fast' | 'unknown' {
    if (!this.connection) return 'unknown';
    
    const effectiveType = this.connection.effectiveType;
    const downlink = this.connection.downlink;
    const saveData = this.connection.saveData;
    
    // Respect user's data saving preference
    if (saveData) return 'slow';
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    if (effectiveType === '4g' && downlink && downlink < 1.5) return 'medium';
    
    return 'fast';
  }

  /**
   * Get device capability level
   */
  getDeviceCapability(): 'low' | 'medium' | 'high' {
    const memory = this.memory || 4;
    const cores = this.cores || 2;
    
    // Low-end device detection
    if (memory <= 2 || cores <= 2) return 'low';
    
    // Mid-range device
    if (memory <= 4 || cores <= 4) return 'medium';
    
    // High-end device
    return 'high';
  }

  /**
   * Check if heavy resources should be loaded
   */
  shouldLoadHeavyResources(): boolean {
    return this.getNetworkSpeed() !== 'slow' && this.getDeviceCapability() !== 'low';
  }

  /**
   * Get recommended image quality based on network and device
   */
  getImageQuality(): 'low' | 'medium' | 'high' {
    const speed = this.getNetworkSpeed();
    const capability = this.getDeviceCapability();
    
    if (speed === 'slow' || capability === 'low') return 'low';
    if (speed === 'medium' || capability === 'medium') return 'medium';
    
    return 'high';
  }

  /**
   * Get recommended animation settings
   */
  getAnimationSettings() {
    // Default settings for SSR
    if (typeof window === 'undefined') {
      return { 
        duration: 0.3, 
        animate: true,
        stagger: 0.05,
        complexity: 'medium' as const
      };
    }
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const capability = this.getDeviceCapability();
    
    if (prefersReducedMotion) {
      return { 
        duration: 0, 
        animate: false,
        stagger: 0,
        complexity: 'none' as const
      };
    }
    
    if (isMobile || capability === 'low') {
      return { 
        duration: 0.2, 
        animate: true,
        stagger: 0,
        complexity: 'simple' as const
      };
    }
    
    if (capability === 'medium') {
      return { 
        duration: 0.3, 
        animate: true,
        stagger: 0.05,
        complexity: 'medium' as const
      };
    }
    
    return { 
      duration: 0.5, 
      animate: true,
      stagger: 0.1,
      complexity: 'full' as const
    };
  }

  /**
   * Check if lazy loading should be used
   */
  shouldLazyLoad(): boolean {
    // Always lazy load on slow networks or low-end devices
    const speed = this.getNetworkSpeed();
    const capability = this.getDeviceCapability();
    
    return speed === 'slow' || capability === 'low';
  }

  /**
<<<<<<< HEAD
   * Get the number of items to preload - increased for better LCP
=======
   * Get the number of items to preload
>>>>>>> origin/master
   */
  getPreloadCount(): number {
    const speed = this.getNetworkSpeed();
    const capability = this.getDeviceCapability();
    
<<<<<<< HEAD
    // Increase preload count to improve LCP performance
    if (speed === 'slow' || capability === 'low') return 3; // Increased from 2
    if (speed === 'medium' || capability === 'medium') return 6; // Increased from 4
    
    return 9; // Increased from 6 for fast connections
=======
    if (speed === 'slow' || capability === 'low') return 2;
    if (speed === 'medium' || capability === 'medium') return 4;
    
    return 6;
>>>>>>> origin/master
  }

  /**
   * Defer non-critical operations based on device capability
   */
  deferOperation(callback: () => void, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    const capability = this.getDeviceCapability();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile || capability === 'high') {
      // Execute immediately on desktop or high-end mobile
      callback();
      return;
    }
    
    // Use requestIdleCallback for non-critical work
    if ('requestIdleCallback' in window) {
      const timeout = priority === 'high' ? 1000 : priority === 'medium' ? 2000 : 3000;
      
      (window as any).requestIdleCallback(callback, { timeout });
    } else {
      // Fallback for Safari and older browsers
      const delay = priority === 'high' ? 100 : priority === 'medium' ? 500 : 1000;
      setTimeout(callback, delay);
    }
  }

  /**
   * Check if prefetching should be enabled
   */
  shouldPrefetch(): boolean {
    const speed = this.getNetworkSpeed();
    const saveData = this.connection?.saveData;
    
    // Don't prefetch on slow connections or when save data is enabled
    return speed === 'fast' && !saveData;
  }
}

// Export singleton instance
export const adaptiveLoader = new AdaptiveLoader();

// Hook for React components
export function useAdaptiveLoading() {
  // Safe defaults for SSR
  if (typeof window === 'undefined') {
    return {
      networkSpeed: 'unknown' as const,
      deviceCapability: 'medium' as const,
      shouldLoadHeavyResources: true,
      imageQuality: 'medium' as const,
      animationSettings: { 
        duration: 0.3, 
        animate: true,
        stagger: 0.05,
        complexity: 'medium' as const
      },
      shouldLazyLoad: true,
<<<<<<< HEAD
      preloadCount: 6, // Increased for better LCP in SSR
=======
      preloadCount: 3,
>>>>>>> origin/master
      shouldPrefetch: false,
      deferOperation: (callback: () => void) => callback(),
    };
  }
  
  const loader = new AdaptiveLoader();
  
  return {
    networkSpeed: loader.getNetworkSpeed(),
    deviceCapability: loader.getDeviceCapability(),
    shouldLoadHeavyResources: loader.shouldLoadHeavyResources(),
    imageQuality: loader.getImageQuality(),
    animationSettings: loader.getAnimationSettings(),
    shouldLazyLoad: loader.shouldLazyLoad(),
    preloadCount: loader.getPreloadCount(),
    shouldPrefetch: loader.shouldPrefetch(),
    deferOperation: (callback: () => void, priority?: 'low' | 'medium' | 'high') => 
      loader.deferOperation(callback, priority),
  };
}