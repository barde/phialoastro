// Dynamic Import Manager for Code Splitting
// Manages loading of feature-specific code chunks only when needed

interface FeatureDetector {
  name: string;
  selector: string;
  loader: () => Promise<void>;
}

class DynamicImportManager {
  private loadedFeatures = new Set<string>();
  private loadingFeatures = new Set<string>();

  private detectors: FeatureDetector[] = [
    {
      name: 'portfolio',
      selector: '.portfolio-section, [x-data*="portfolioSection"], [data-feature="portfolio"]',
      loader: () => Promise.all([
        import('../../features/portfolio/client.js'),
        // Preload lazy modal manager for when it's needed
        import('../../features/portfolio/utils/lazyModalManager.js')
      ]).then(() => void 0)
    },
    {
      name: 'contact',
      selector: 'form[data-contact-form], .turnstile-widget, .contact-form, [data-feature="contact"]',
      loader: () => import('../../features/contact/client.js').then(() => void 0)
    },
    {
      name: 'icons',
      selector: '[data-lucide], .lucide-icon',
      loader: async () => {
        const lucide = await import('lucide-react');
        (window as any).lucideReact = lucide;
      }
    }
  ];

  async loadFeature(featureName: string): Promise<void> {
    if (this.loadedFeatures.has(featureName) || this.loadingFeatures.has(featureName)) {
      return;
    }

    const detector = this.detectors.find(d => d.name === featureName);
    if (!detector) {
      console.warn(`Unknown feature: ${featureName}`);
      return;
    }

    this.loadingFeatures.add(featureName);
    
    try {
      await detector.loader();
      this.loadedFeatures.add(featureName);
      console.log(`✅ Feature loaded: ${featureName}`);
    } catch (error) {
      console.error(`❌ Failed to load feature ${featureName}:`, error);
    } finally {
      this.loadingFeatures.delete(featureName);
    }
  }

  detectAndLoad(): void {
    for (const detector of this.detectors) {
      if (document.querySelector(detector.selector)) {
        this.loadFeature(detector.name);
      }
    }
  }

  observeForLazyLoading(): void {
    // Use Intersection Observer for viewport-based loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const featureName = entry.target.getAttribute('data-feature');
          if (featureName) {
            this.loadFeature(featureName);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { rootMargin: '100px' }); // Start loading 100px before element is visible

    // Observe elements with data-feature attributes
    document.querySelectorAll('[data-feature]').forEach(el => {
      observer.observe(el);
    });
  }

  // Prefetch features that are likely to be needed soon
  prefetchFeatures(featureNames: string[]): void {
    featureNames.forEach(name => {
      const detector = this.detectors.find(d => d.name === name);
      if (detector) {
        // Use link prefetch for better browser caching
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = detector.loader.toString().includes('portfolio') 
          ? '/_astro/portfolio.js' 
          : detector.loader.toString().includes('contact')
          ? '/_astro/contact.js'
          : '/_astro/icons.js';
        document.head.appendChild(link);
      }
    });
  }
}

// Create global instance
const dynamicImports = new DynamicImportManager();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dynamicImports.detectAndLoad();
    dynamicImports.observeForLazyLoading();
  });
} else {
  dynamicImports.detectAndLoad();
  dynamicImports.observeForLazyLoading();
}

// Export for manual control if needed
export { dynamicImports };

// Global access for debugging
(window as any).dynamicImports = dynamicImports;