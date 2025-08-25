// Portfolio feature client-side entry point
// This file is loaded only when portfolio components are detected

// Dynamic import Alpine.js for portfolio interactions
const initPortfolioAlpine = async () => {
  try {
    const { default: Alpine } = await import('alpinejs');
    
    // Portfolio section Alpine component
    (window as any).portfolioSection = function(data: any) {
      return {
        items: data.items,
        categories: data.categories,
        categoryMap: data.categoryMap,
        activeFilter: 'all',
        selectedItem: null,
        isModalOpen: false,
        currentImageIndex: 0,
        lang: data.lang || 'de',
        
        // Computed property for filtered items
        get filteredItems() {
          if (this.activeFilter === 'all') {
            return this.items;
          }
          return this.items.filter((item: any) => {
            const itemCategory = this.categoryMap[item.category] || item.category.toLowerCase();
            return itemCategory === this.activeFilter;
          });
        },
        
        // Set filter and track analytics
        setFilter(categoryId: string) {
          this.activeFilter = categoryId;
          
          // Track filter usage (if analytics available)
          if (typeof gtag !== 'undefined') {
            gtag('event', 'portfolio_filter', {
              category: categoryId,
              language: this.lang
            });
          }
        },
        
        // Open modal for item details
        openModal(item: any) {
          this.selectedItem = item;
          this.currentImageIndex = 0;
          this.isModalOpen = true;
          document.body.style.overflow = 'hidden';
        },
        
        // Close modal
        closeModal() {
          this.isModalOpen = false;
          this.selectedItem = null;
          document.body.style.overflow = 'auto';
        },
        
        // Navigate images in modal
        nextImage() {
          if (this.selectedItem && this.selectedItem.gallery) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedItem.gallery.length;
          }
        },
        
        prevImage() {
          if (this.selectedItem && this.selectedItem.gallery) {
            this.currentImageIndex = this.currentImageIndex === 0 
              ? this.selectedItem.gallery.length - 1 
              : this.currentImageIndex - 1;
          }
        }
      };
    };
    
    // Initialize Alpine if not already started
    if (!(window as any).Alpine) {
      (window as any).Alpine = Alpine;
      Alpine.start();
    }
    
    console.log('Portfolio Alpine.js initialized');
  } catch (error) {
    console.error('Failed to load Alpine.js for portfolio:', error);
  }
};

// Initialize when portfolio elements are found
const init = () => {
  const portfolioElements = document.querySelectorAll('.portfolio-section, [x-data*="portfolioSection"]');
  if (portfolioElements.length > 0) {
    initPortfolioAlpine();
  }
};

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};