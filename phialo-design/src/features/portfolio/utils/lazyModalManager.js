// Lazy Modal Manager for Portfolio
// Loads modal HTML and JavaScript only when needed

class LazyModalManager {
  constructor() {
    this.isLoaded = false;
    this.isLoading = false;
    this.modalContainer = null;
    this.loadingIndicator = null;
  }

  // Create loading indicator
  createLoadingIndicator() {
    const loading = document.createElement('div');
    loading.className = 'fixed inset-0 z-50 flex items-center justify-center bg-midnight/50';
    loading.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
          <span class="text-gray-700">Loading...</span>
        </div>
      </div>
    `;
    return loading;
  }

  // Load modal content dynamically
  async loadModal(lang = 'de') {
    if (this.isLoaded || this.isLoading) {
      return this.modalContainer;
    }

    this.isLoading = true;

    // Show loading indicator
    this.loadingIndicator = this.createLoadingIndicator();
    document.body.appendChild(this.loadingIndicator);

    try {
      // Load modal HTML template
      const response = await fetch(`/_modal-template?lang=${lang}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        // Fallback: inject modal template directly
        await this.injectModalTemplate(lang);
      } else {
        const html = await response.text();
        // Extract template content and inject it
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const template = tempDiv.querySelector('#portfolio-modal-template');
        
        if (template) {
          document.body.appendChild(template);
          this.modalContainer = template;
        } else {
          await this.injectModalTemplate(lang);
        }
      }

      this.isLoaded = true;
      console.log('✅ Portfolio modal loaded successfully');
      
    } catch (error) {
      console.warn('Failed to load modal template, using fallback:', error);
      await this.injectModalTemplate(lang);
    } finally {
      this.isLoading = false;
      // Remove loading indicator
      if (this.loadingIndicator) {
        document.body.removeChild(this.loadingIndicator);
        this.loadingIndicator = null;
      }
    }

    return this.modalContainer;
  }

  // Fallback: Inject modal template directly
  async injectModalTemplate(lang = 'de') {
    const isEnglish = lang === 'en';
    
    const template = document.createElement('template');
    template.id = 'portfolio-modal-template';
    template.innerHTML = this.getModalTemplate(isEnglish);
    
    document.body.appendChild(template);
    this.modalContainer = template;
    this.isLoaded = true;
  }

  // Get modal template HTML
  getModalTemplate(isEnglish = false) {
    const closeLabel = isEnglish ? 'Close modal' : 'Modal schließen';
    const prevLabel = isEnglish ? 'Previous item' : 'Vorheriges Element';
    const nextLabel = isEnglish ? 'Next item' : 'Nächstes Element';
    const prevImageLabel = isEnglish ? 'Previous image' : 'Vorheriges Bild';
    const nextImageLabel = isEnglish ? 'Next image' : 'Nächstes Bild';
    const showImageLabel = isEnglish ? 'Show image' : 'Bild zeigen';
    const featuresLabel = isEnglish ? 'Features' : 'Eigenschaften';
    const materialsLabel = isEnglish ? 'Materials' : 'Materialien';

    return `
      <div 
        class="portfolio-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/75"
        x-show="isModalOpen"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        @click="closeModal()"
        @keydown.escape.window="closeModal()"
        style="display: none;"
      >
        <div 
          @click.stop
          x-transition:enter="transition ease-out duration-300"
          x-transition:enter-start="opacity-0 scale-90"
          x-transition:enter-end="opacity-100 scale-100"
          x-transition:leave="transition ease-in duration-200"
          x-transition:leave-start="opacity-100 scale-100"
          x-transition:leave-end="opacity-0 scale-90"
          class="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
        >
          <!-- Close button -->
          <button 
            @click="closeModal()"
            class="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="${closeLabel}"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Navigation arrows -->
          <template x-if="filteredItems && filteredItems.length > 1">
            <div>
              <button 
                @click="navigateModal('prev')"
                class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="${prevLabel}"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button 
                @click="navigateModal('next')"
                class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="${nextLabel}"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-2 h-full">
            <!-- Image carousel -->
            <div class="relative bg-gray-100 flex items-center justify-center p-8">
              <template x-if="selectedItem">
                <div class="w-full">
                  <template x-if="selectedItem.youtubeVideoId">
                    <div class="aspect-video">
                      <iframe
                        :src="'https://www.youtube.com/embed/' + selectedItem.youtubeVideoId"
                        class="w-full h-full rounded-lg"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        :title="selectedItem.title"
                      ></iframe>
                    </div>
                  </template>
                  <template x-if="!selectedItem.youtubeVideoId && selectedItem.gallery">
                    <div>
                      <img 
                        :src="selectedItem.gallery[currentImageIndex]"
                        :alt="selectedItem.title"
                        class="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                      />
                      <!-- Image navigation dots -->
                      <template x-if="selectedItem.gallery.length > 1">
                        <div class="flex justify-center gap-2 mt-4">
                          <template x-for="(img, idx) in selectedItem.gallery" :key="idx">
                            <button 
                              @click="currentImageIndex = idx"
                              :class="{'bg-gold': currentImageIndex === idx, 'bg-gray-300': currentImageIndex !== idx}"
                              class="w-2 h-2 rounded-full transition-colors"
                              :aria-label="'${showImageLabel} ' + (idx + 1)"
                            ></button>
                          </template>
                        </div>
                      </template>
                      <!-- Image navigation arrows -->
                      <template x-if="selectedItem.gallery.length > 1">
                        <div>
                          <button 
                            @click="prevImage()"
                            class="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                            aria-label="${prevImageLabel}"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                          </button>
                          <button 
                            @click="nextImage()"
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                            aria-label="${nextImageLabel}"
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </button>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </template>
            </div>

            <!-- Content -->
            <div class="p-8 overflow-y-auto">
              <template x-if="selectedItem">
                <div>
                  <h2 class="text-3xl font-display font-medium mb-4" x-text="selectedItem.title"></h2>
                  <p class="text-gray-600 mb-6" x-text="selectedItem.description"></p>
                  
                  <!-- Features -->
                  <template x-if="selectedItem.features && selectedItem.features.length > 0">
                    <div class="mb-6">
                      <h3 class="text-lg font-semibold mb-3">${featuresLabel}</h3>
                      <ul class="list-disc list-inside space-y-1 text-gray-600">
                        <template x-for="feature in selectedItem.features" :key="feature">
                          <li x-text="feature"></li>
                        </template>
                      </ul>
                    </div>
                  </template>
                  
                  <!-- Materials -->
                  <template x-if="selectedItem.materials && selectedItem.materials.length > 0">
                    <div class="mb-6">
                      <h3 class="text-lg font-semibold mb-3">${materialsLabel}</h3>
                      <div class="flex flex-wrap gap-2">
                        <template x-for="material in selectedItem.materials" :key="material">
                          <span class="px-3 py-1 bg-gray-100 rounded-full text-sm" x-text="material"></span>
                        </template>
                      </div>
                    </div>
                  </template>
                  
                  <!-- Tags -->
                  <template x-if="selectedItem.tags && selectedItem.tags.length > 0">
                    <div>
                      <h3 class="text-lg font-semibold mb-3">Tags</h3>
                      <div class="flex flex-wrap gap-2">
                        <template x-for="tag in selectedItem.tags" :key="tag">
<<<<<<< HEAD
                          <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm" x-text="tag"></span>
=======
                          <span class="px-3 py-1 bg-gold/10 text-gold rounded-full text-sm" x-text="tag"></span>
>>>>>>> origin/master
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render the loaded modal for a specific Alpine component instance
  async renderModal(alpineComponent, lang = 'de') {
    await this.loadModal(lang);
    
    // Clone the template content and attach to the Alpine component
    const template = document.querySelector('#portfolio-modal-template');
    if (!template) {
      throw new Error('Modal template not found');
    }

    // Find the Alpine component's container
    const portfolioSection = alpineComponent.$el || document.querySelector('.portfolio-section');
    if (!portfolioSection) {
      throw new Error('Portfolio section not found');
    }

    // Clone and append the modal content
    const modalContent = template.content ? template.content.cloneNode(true) : template.cloneNode(true);
    const modalElement = modalContent.querySelector ? modalContent.querySelector('.portfolio-modal') : modalContent;
    
    if (modalElement) {
      portfolioSection.appendChild(modalElement);
      return modalElement;
    }

    throw new Error('Modal element not found in template');
  }

  // Clean up modal when component is destroyed
  cleanup() {
    if (this.modalContainer && this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
    if (this.loadingIndicator && this.loadingIndicator.parentNode) {
      this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
    }
    this.isLoaded = false;
    this.modalContainer = null;
    this.loadingIndicator = null;
  }
}

// Create global instance
const lazyModalManager = new LazyModalManager();

// Export for module systems and make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = lazyModalManager;
}

if (typeof window !== 'undefined') {
  window.lazyModalManager = lazyModalManager;
}

export default lazyModalManager;