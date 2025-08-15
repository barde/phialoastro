/**
 * Deferred Loading Utility
 * Optimizes JavaScript execution by deferring non-critical scripts on mobile
 */

import { adaptiveLoader } from './adaptive-loading';

type LoadPriority = 'critical' | 'high' | 'medium' | 'low';
type LoadCallback = () => void | Promise<void>;

interface DeferredModule {
  id: string;
  priority: LoadPriority;
  load: LoadCallback;
  loaded?: boolean;
  loading?: boolean;
}

class DeferredLoader {
  private modules: Map<string, DeferredModule> = new Map();
  private loadQueue: DeferredModule[] = [];
  private isLoading = false;
  private isMobile = false;
  private hasIdleCallback = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                      window.innerWidth < 768;
      this.hasIdleCallback = 'requestIdleCallback' in window;
    }
  }

  /**
   * Register a module for deferred loading
   */
  register(id: string, priority: LoadPriority, load: LoadCallback) {
    if (this.modules.has(id)) {
      console.warn(`Module ${id} already registered`);
      return;
    }

    this.modules.set(id, {
      id,
      priority,
      load,
      loaded: false,
      loading: false
    });
  }

  /**
   * Load modules based on priority and device capabilities
   */
  async loadModules() {
    if (this.isLoading) return;
    this.isLoading = true;

    // Sort modules by priority
    const sortedModules = Array.from(this.modules.values()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Load critical modules immediately
    const criticalModules = sortedModules.filter(m => m.priority === 'critical' && !m.loaded);
    await this.loadModuleBatch(criticalModules);

    // Defer other modules based on device and network
    const shouldDefer = this.isMobile || !adaptiveLoader.shouldLoadHeavyResources();
    
    if (shouldDefer) {
      // Load high priority after a delay
      setTimeout(async () => {
        const highModules = sortedModules.filter(m => m.priority === 'high' && !m.loaded);
        await this.loadModuleBatch(highModules);
        
        // Load medium and low priority when idle
        this.loadWhenIdle(() => {
          const remainingModules = sortedModules.filter(m => 
            (m.priority === 'medium' || m.priority === 'low') && !m.loaded
          );
          this.loadModuleBatch(remainingModules);
        });
      }, 500);
    } else {
      // Load all modules on desktop/fast connections
      await this.loadModuleBatch(sortedModules.filter(m => !m.loaded));
    }

    this.isLoading = false;
  }

  /**
   * Load a batch of modules
   */
  private async loadModuleBatch(modules: DeferredModule[]) {
    const promises = modules.map(async (module) => {
      if (module.loading || module.loaded) return;
      
      module.loading = true;
      try {
        await module.load();
        module.loaded = true;
      } catch (error) {
        console.error(`Failed to load module ${module.id}:`, error);
      } finally {
        module.loading = false;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Load callback when browser is idle
   */
  private loadWhenIdle(callback: () => void, timeout = 2000) {
    if (this.hasIdleCallback) {
      (window as any).requestIdleCallback(callback, { timeout });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, timeout);
    }
  }

  /**
   * Load a specific module by ID
   */
  async loadModule(id: string) {
    const module = this.modules.get(id);
    if (!module) {
      console.error(`Module ${id} not found`);
      return;
    }

    if (module.loaded || module.loading) return;

    module.loading = true;
    try {
      await module.load();
      module.loaded = true;
    } catch (error) {
      console.error(`Failed to load module ${id}:`, error);
    } finally {
      module.loading = false;
    }
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(id: string): boolean {
    const module = this.modules.get(id);
    return module?.loaded ?? false;
  }
}

// Export singleton instance
export const deferredLoader = new DeferredLoader();

/**
 * Defer heavy operations based on device and network conditions
 */
export function deferHeavyOperations(operations: {
  analytics?: () => void | Promise<void>;
  chatWidget?: () => void | Promise<void>;
  socialSharing?: () => void | Promise<void>;
  videoPlayer?: () => void | Promise<void>;
  animations?: () => void | Promise<void>;
  [key: string]: (() => void | Promise<void>) | undefined;
}) {
  const isMobile = typeof window !== 'undefined' && 
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
  
  if (isMobile || !adaptiveLoader.shouldLoadHeavyResources()) {
    // Use requestIdleCallback for non-critical work
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        Object.values(operations).forEach(operation => {
          if (operation) operation();
        });
      }, { timeout: 3000 });
    } else {
      // Fallback for Safari and older browsers
      setTimeout(() => {
        Object.values(operations).forEach(operation => {
          if (operation) operation();
        });
      }, 1500);
    }
  } else {
    // Load immediately on desktop with good connection
    Object.values(operations).forEach(operation => {
      if (operation) operation();
    });
  }
}

/**
 * React hook for deferred component loading
 */
export function useDeferredComponent<T>(
  componentLoader: () => Promise<{ default: T }>,
  priority: LoadPriority = 'medium'
): T | null {
  if (typeof window === 'undefined') return null;

  const [Component, setComponent] = React.useState<T | null>(null);
  const loaderId = React.useId();

  React.useEffect(() => {
    let mounted = true;

    deferredLoader.register(loaderId, priority, async () => {
      const module = await componentLoader();
      if (mounted) {
        setComponent(module.default);
      }
    });

    // Start loading based on priority
    if (priority === 'critical') {
      deferredLoader.loadModule(loaderId);
    } else {
      deferredLoader.loadModules();
    }

    return () => {
      mounted = false;
    };
  }, [loaderId, priority]);

  return Component;
}

/**
 * Intersection Observer-based lazy loading for components
 */
export function useLazyComponent<T>(
  componentLoader: () => Promise<{ default: T }>,
  options?: IntersectionObserverInit
): [T | null, React.RefObject<HTMLDivElement>] {
  if (typeof window === 'undefined') return [null, React.createRef()];

  const [Component, setComponent] = React.useState<T | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current || hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          componentLoader().then(module => {
            setComponent(module.default);
          });
        }
      },
      {
        rootMargin: adaptiveLoader.getLoadingStrategy().lazyLoadOffset,
        ...options
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return [Component, ref];
}

/**
 * Preload a module for faster loading when needed
 */
export function preloadModule(moduleLoader: () => Promise<any>) {
  if (typeof window === 'undefined') return;

  // Only preload on fast networks without data saver
  if (adaptiveLoader.shouldEnableFeature('prefetch')) {
    // Use link preload for ES modules if possible
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    
    // This is a simplified version - in production you'd need to extract the actual URL
    moduleLoader();
  }
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Import failed (attempt ${i + 1}/${retries}):`, error);
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Add React import for the hooks
import * as React from 'react';