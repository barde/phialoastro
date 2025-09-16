import type { PortfolioItemData } from '../../features/portfolio/types/portfolio';

/**
 * Factory function to create mock PortfolioItemData objects for testing
 * @param overrides - Partial properties to override the defaults
 * @returns Complete PortfolioItemData object with test data
 */
export function createMockPortfolioItem(
  overrides: Partial<PortfolioItemData> = {}
): PortfolioItemData {
  return {
    id: 1,
    slug: 'test-portfolio-item',
    title: 'Test Portfolio Item',
    description: 'Test description for portfolio item',
    category: 'rings',
    image: '/images/test-portfolio.jpg',
    year: 2024,
    materials: ['Silver', 'Gold'],
    techniques: ['Handmade', '3D Print'],
    details: 'Detailed information about the test portfolio item',
    gallery: [
      '/images/test-gallery-1.jpg',
      '/images/test-gallery-2.jpg',
      '/images/test-gallery-3.jpg'
    ],
    client: 'Test Client',
    projectDate: 'January 2024',
    price: '$1,000',
    tags: ['modern', 'minimal', 'luxury'],
    ...overrides
  };
}

/**
 * Factory function to create multiple mock portfolio items
 * @param count - Number of items to generate
 * @param categoryOverride - Optional category to apply to all items
 * @returns Array of PortfolioItemData objects
 */
export function createMockPortfolioItems(
  count: number,
  categoryOverride?: string
): PortfolioItemData[] {
  const categories = ['rings', 'earrings', 'necklaces', 'sculptures', 'special'];
  
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const category = categoryOverride || categories[index % categories.length];
    
    return createMockPortfolioItem({
      id,
      slug: `portfolio-item-${id}`,
      title: `Portfolio Item ${id}`,
      description: `Description for portfolio item ${id}`,
      category,
      year: 2020 + (index % 5),
      price: `$${(id * 100).toLocaleString()}`
    });
  });
}