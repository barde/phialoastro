/**
 * Performance optimization utilities
 * Helpers for improving Core Web Vitals
 */

/**
 * Preload critical resources
 * Use for fonts, hero images, critical CSS
 */
export function preloadResource(
  href: string,
  as: 'font' | 'image' | 'style' | 'script',
  options?: {
    type?: string;
    crossorigin?: 'anonymous' | 'use-credentials';
    fetchpriority?: 'high' | 'low' | 'auto';
  }
) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (options?.type) link.type = options.type;
  if (options?.crossorigin) link.crossOrigin = options.crossorigin;
  if (options?.fetchpriority) link.fetchPriority = options.fetchpriority;
  
  document.head.appendChild(link);
}

/**
 * Prefetch resources for likely navigation
 * Use for next page resources
 */
export function prefetchResource(href: string) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }
}

/**
 * Lazy load images with native loading or IntersectionObserver
 */
export function setupLazyLoading() {
  // Check for native lazy loading support
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-lazy]');
    images.forEach(img => {
      img.loading = 'lazy';
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  } else {
    // Fallback to IntersectionObserver
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    document.querySelectorAll('img[data-lazy]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Break up long tasks to improve INP
 */
export function yieldToMain() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Debounce function to reduce event handler frequency
 * Improves INP by reducing processing time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * Useful for scroll and resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Request idle callback with fallback
 */
export function whenIdle(callback: () => void, options?: IdleRequestOptions) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * Optimize animation performance
 * Use CSS transforms and will-change
 */
export function optimizeAnimation(element: HTMLElement) {
  // Add will-change for planned animations
  element.style.willChange = 'transform';
  
  // Force hardware acceleration
  element.style.transform = 'translateZ(0)';
  
  // Clean up after animation
  const cleanup = () => {
    element.style.willChange = 'auto';
  };
  
  // Listen for animation end
  element.addEventListener('transitionend', cleanup, { once: true });
  element.addEventListener('animationend', cleanup, { once: true });
  
  return cleanup;
}

/**
 * Monitor and report long tasks
 */
export function monitorLongTasks(callback: (duration: number) => void) {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Long tasks are > 50ms
          if (entry.duration > 50) {
            callback(entry.duration);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      
      return () => observer.disconnect();
    } catch (e) {
      // Long task monitoring not supported
      console.debug('Long task monitoring not supported');
    }
  }
  
  return () => {};
}

/**
 * Optimize CLS by reserving space for dynamic content
 */
export function reserveSpace(
  container: HTMLElement,
  aspectRatio: number,
  minHeight?: number
) {
  // Calculate height based on width and aspect ratio
  const width = container.offsetWidth;
  const height = width / aspectRatio;
  
  // Apply min-height to reserve space
  container.style.minHeight = `${Math.max(height, minHeight || 0)}px`;
  
  // Update on resize
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const newHeight = entry.contentRect.width / aspectRatio;
      container.style.minHeight = `${Math.max(newHeight, minHeight || 0)}px`;
    }
  });
  
  resizeObserver.observe(container);
  
  return () => resizeObserver.disconnect();
}

/**
 * Optimize font loading to reduce CLS
 */
export function optimizeFontLoading() {
  // Check if fonts are already loaded
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
  
  // Add font-display: optional for critical fonts
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: optional;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Get network connection info
 */
export function getConnectionInfo() {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData || false
    };
  }
  
  return null;
}

/**
 * Adaptive loading based on network conditions
 */
export function shouldLoadHighQuality(): boolean {
  const connection = getConnectionInfo();
  
  if (!connection) return true; // Default to high quality
  
  // Skip high quality for slow connections or data saver
  if (connection.saveData) return false;
  if (connection.effectiveType === 'slow-2g') return false;
  if (connection.effectiveType === '2g') return false;
  
  return true;
}

/**
 * Performance mark utility
 */
export function mark(name: string) {
  if (performance && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Performance measure utility
 */
export function measure(name: string, startMark: string, endMark?: string) {
  if (performance && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch (e) {
      console.debug(`Failed to measure ${name}:`, e);
    }
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
  if (!performance || !performance.getEntriesByType) {
    return null;
  }
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    
    // Paint timing
    fp: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
  };
}