// Shared Alpine.js utilities to reduce duplication
export const alpineHelpers = {
  // Common modal management
  modal: {
    open(state, item = null) {
      state.isModalOpen = true;
      if (item) state.selectedItem = item;
      document.body.style.overflow = 'hidden';
    },
    close(state) {
      state.isModalOpen = false;
      document.body.style.overflow = '';
      if (state.selectedItem) {
        setTimeout(() => { state.selectedItem = null; }, 300);
      }
    }
  },
  
  // Common form validation
  validation: {
    email(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    required(value) {
      return value && value.toString().trim().length > 0;
    },
    phone(value) {
      return !value || /^[\d\s\-\+\(\)]+$/.test(value);
    }
  },
  
  // Debounce helper
  debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  // Filter helper
  filterItems(items, filter, key = 'category') {
    return filter === 'all' ? items : items.filter(item => item[key] === filter);
  },
  
  // Image preloader
  preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
};

// Make available globally for Alpine components
if (typeof window !== 'undefined') {
  window.alpineHelpers = alpineHelpers;
}