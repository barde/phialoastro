import { lazy, Suspense } from 'react';
import type { PortfolioItemData } from './PortfolioSection';

// Lazy load the actual grid component
const PortfolioGrid = lazy(() => 
  import('./OptimizedPortfolioGrid').then(module => ({
    default: module.default
  }))
);

interface LazyPortfolioGridProps {
  items: PortfolioItemData[];
  lang?: 'en' | 'de';
}

/**
 * Loading skeleton that matches the grid layout
 */
function PortfolioGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="h-full w-full flex flex-col justify-end p-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Lazy-loaded portfolio grid component.
 * Loads the heavy portfolio grid component only when needed.
 * This reduces initial bundle size significantly.
 */
export default function LazyPortfolioGrid({ items, lang = 'de' }: LazyPortfolioGridProps) {
  return (
    <Suspense fallback={<PortfolioGridSkeleton />}>
      <PortfolioGrid 
        portfolioItems={items} 
        lang={lang}
      />
    </Suspense>
  );
}