/**
 * Adaptive Loading Utility
 * Provides network-aware and device-capability-aware loading strategies
 * for optimizing mobile performance and user experience.
 */

export type NetworkSpeed = 'slow' | 'medium' | 'fast' | 'unknown';
export type DeviceCapability = 'low' | 'medium' | 'high';
export type ImageQuality = 'low' | 'medium' | 'high';

interface ConnectionInfo {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorExtended extends Navigator {
  connection?: ConnectionInfo;
  mozConnection?: ConnectionInfo;
  webkitConnection?: ConnectionInfo;
  deviceMemory?: number;
}

export class AdaptiveLoader {
  private connection: ConnectionInfo | undefined;
  private memory: number;
  private cores: number;
  private prefersReducedMotion: boolean;

  constructor() {
    const nav = navigator as NavigatorExtended;
    this.connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    this.memory = nav.deviceMemory || 4; // Default to 4GB if not available
    this.cores = navigator.hardwareConcurrency || 2; // Default to 2 cores
    this.prefersReducedMotion = this.checkReducedMotion();
  }

  /**
   * Check if user prefers reduced motion
   */
  private checkReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get current network speed classification
   */
  getNetworkSpeed(): NetworkSpeed {
    if (!this.connection) return 'unknown';
    
    const effectiveType = this.connection.effectiveType;
    const downlink = this.connection.downlink;
    
    // Check if user has data saver enabled
    if (this.connection.saveData) return 'slow';
    
    // Classify based on effective type
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    if (effectiveType === '4g') {
      // Further classify 4G based on downlink speed
      if (downlink && downlink < 1.5) return 'medium';
      return 'fast';
    }
    
    return 'fast';
  }

  /**
   * Get device hardware capability classification
   */
  getDeviceCapability(): DeviceCapability {
    // Classify based on memory and CPU cores
    if (this.memory <= 2 || this.cores <= 2) return 'low';
    if (this.memory <= 4 || this.cores <= 4) return 'medium';
    return 'high';
  }

  /**
   * Determine if heavy resources should be loaded
   */
  shouldLoadHeavyResources(): boolean {
    const networkSpeed = this.getNetworkSpeed();
    const deviceCapability = this.getDeviceCapability();
    
    // Don't load heavy resources on slow networks or low-end devices
    return networkSpeed !== 'slow' && deviceCapability !== 'low';
  }

  /**
   * Get recommended image quality based on network and device
   */
  getImageQuality(): ImageQuality {
    const speed = this.getNetworkSpeed();
    const capability = this.getDeviceCapability();
    
    // Prioritize network speed over device capability for images
    if (speed === 'slow' || this.connection?.saveData) return 'low';
    if (speed === 'medium' || capability === 'low') return 'medium';
    if (speed === 'unknown' && capability === 'medium') return 'medium';
    
    return 'high';
  }

  /**
   * Get animation settings based on device and preferences
   */
  getAnimationSettings() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const capability = this.getDeviceCapability();
    
    // Disable animations if user prefers reduced motion
    if (this.prefersReducedMotion) {
      return {
        duration: 0,
        animate: false,
        stagger: 0,
        complexity: 'none' as const
      };
    }
    
    // Simplify animations on mobile or low-end devices
    if (isMobile || capability === 'low') {
      return {
        duration: 0.2,
        animate: true,
        stagger: 0,
        complexity: 'simple' as const
      };
    }
    
    // Medium complexity for medium devices
    if (capability === 'medium') {
      return {
        duration: 0.3,
        animate: true,
        stagger: 0.05,
        complexity: 'medium' as const
      };
    }
    
    // Full animations for high-end devices
    return {
      duration: 0.5,
      animate: true,
      stagger: 0.1,
      complexity: 'full' as const
    };
  }

  /**
   * Determine if a specific feature should be enabled
   */
  shouldEnableFeature(feature: 'parallax' | 'blur' | 'animations' | 'prefetch'): boolean {
    const networkSpeed = this.getNetworkSpeed();
    const deviceCapability = this.getDeviceCapability();
    
    switch (feature) {
      case 'parallax':
        // Parallax is GPU-intensive, only enable on high-end devices
        return deviceCapability === 'high' && !this.prefersReducedMotion;
      
      case 'blur':
        // Backdrop blur effects require good GPU
        return deviceCapability !== 'low';
      
      case 'animations':
        // Respect user preferences first
        return !this.prefersReducedMotion && deviceCapability !== 'low';
      
      case 'prefetch':
        // Only prefetch on fast networks without data saver
        return networkSpeed === 'fast' && !this.connection?.saveData;
      
      default:
        return true;
    }
  }

  /**
   * Get recommended resource loading strategy
   */
  getLoadingStrategy() {
    const networkSpeed = this.getNetworkSpeed();
    const deviceCapability = this.getDeviceCapability();
    
    // Aggressive loading for high-end devices on fast networks
    if (networkSpeed === 'fast' && deviceCapability === 'high') {
      return {
        lazyLoadOffset: '200px', // Start loading 200px before viewport
        preloadCount: 4, // Preload next 4 items
        useIntersectionObserver: true,
        throttleRequests: false
      };
    }
    
    // Conservative loading for slow networks or low-end devices
    if (networkSpeed === 'slow' || deviceCapability === 'low') {
      return {
        lazyLoadOffset: '0px', // Only load when in viewport
        preloadCount: 1, // Minimal preloading
        useIntersectionObserver: true,
        throttleRequests: true // Throttle concurrent requests
      };
    }
    
    // Balanced approach for medium conditions
    return {
      lazyLoadOffset: '100px',
      preloadCount: 2,
      useIntersectionObserver: true,
      throttleRequests: false
    };
  }

  /**
   * Get video quality settings
   */
  getVideoSettings() {
    const networkSpeed = this.getNetworkSpeed();
    const deviceCapability = this.getDeviceCapability();
    
    if (networkSpeed === 'slow' || this.connection?.saveData) {
      return {
        autoplay: false,
        quality: '360p',
        preload: 'none'
      };
    }
    
    if (networkSpeed === 'medium' || deviceCapability === 'low') {
      return {
        autoplay: false,
        quality: '720p',
        preload: 'metadata'
      };
    }
    
    return {
      autoplay: true,
      quality: '1080p',
      preload: 'auto'
    };
  }

  /**
   * Check if connection has changed (for reactive updates)
   */
  onConnectionChange(callback: () => void) {
    if (this.connection && 'addEventListener' in this.connection) {
      (this.connection as any).addEventListener('change', callback);
      return () => {
        if (this.connection && 'removeEventListener' in this.connection) {
          (this.connection as any).removeEventListener('change', callback);
        }
      };
    }
    return () => {}; // No-op cleanup function
  }
}

// Export a singleton instance for consistent usage across the app
export const adaptiveLoader = new AdaptiveLoader();

// Export a React hook for easy usage in components
export function useAdaptiveLoading() {
  if (typeof window === 'undefined') {
    // Return safe defaults for SSR
    return {
      networkSpeed: 'fast' as NetworkSpeed,
      deviceCapability: 'high' as DeviceCapability,
      imageQuality: 'high' as ImageQuality,
      shouldLoadHeavyResources: true,
      animationSettings: {
        duration: 0.5,
        animate: true,
        stagger: 0.1,
        complexity: 'full' as const
      },
      loadingStrategy: {
        lazyLoadOffset: '200px',
        preloadCount: 4,
        useIntersectionObserver: true,
        throttleRequests: false
      }
    };
  }

  const loader = adaptiveLoader;
  
  return {
    networkSpeed: loader.getNetworkSpeed(),
    deviceCapability: loader.getDeviceCapability(),
    imageQuality: loader.getImageQuality(),
    shouldLoadHeavyResources: loader.shouldLoadHeavyResources(),
    animationSettings: loader.getAnimationSettings(),
    loadingStrategy: loader.getLoadingStrategy(),
    shouldEnableFeature: (feature: Parameters<typeof loader.shouldEnableFeature>[0]) => 
      loader.shouldEnableFeature(feature)
  };
}