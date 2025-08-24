/**
 * Dynamic import utilities for lazy loading heavy components
 * This helps reduce the initial bundle size significantly
 */

import { lazy } from 'react';

// Lazy load portfolio components
export const LazyPortfolioSection = lazy(() => 
  import('../features/portfolio/components/PortfolioSectionCSS').then(module => ({
    default: module.default
  }))
);

// Lazy load contact form
export const LazyContactForm = lazy(() => 
  import('../features/contact/components/ContactFormWrapper').then(module => ({
    default: module.default
  }))
);

// Helper to wrap components with loading state
export function withLazyLoading<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}