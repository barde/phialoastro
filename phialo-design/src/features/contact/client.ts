// Contact feature client-side entry point
// This file is loaded only when contact components are detected

// Dynamic import for contact form functionality
const initContactFeatures = async () => {
  try {
    // Load Turnstile only when contact forms are present
    const turnstileWidgets = document.querySelectorAll('.turnstile-widget');
    if (turnstileWidgets.length > 0) {
      // Dynamically load Turnstile
      const turnstile = await import('@cloudflare/turnstile');
      console.log('Turnstile loaded for contact forms');
    }
    
    // Load Alpine.js for contact form interactions if needed
    const alpineElements = document.querySelectorAll('[x-data*="contactForm"]');
    if (alpineElements.length > 0) {
      const { default: Alpine } = await import('alpinejs');
      
      // Contact form Alpine component (if used)
      (window as any).contactForm = function() {
        return {
          formData: {
            name: '',
            email: '',
            message: '',
            subject: '',
            sendCopy: false
          },
          isSubmitting: false,
          showSuccess: false,
          showError: false,
          errorMessage: '',
          
          async submitForm() {
            this.isSubmitting = true;
            try {
              // Form submission logic
              const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData),
              });
              
              if (response.ok) {
                this.showSuccess = true;
                this.resetForm();
              } else {
                throw new Error('Failed to send message');
              }
            } catch (error) {
              this.showError = true;
              this.errorMessage = 'Failed to send message. Please try again.';
            } finally {
              this.isSubmitting = false;
            }
          },
          
          resetForm() {
            this.formData = {
              name: '',
              email: '',
              message: '',
              subject: '',
              sendCopy: false
            };
          }
        };
      };
      
      // Initialize Alpine if not already started
      if (!(window as any).Alpine) {
        (window as any).Alpine = Alpine;
        Alpine.start();
      }
      
      console.log('Contact Alpine.js initialized');
    }
    
  } catch (error) {
    console.error('Failed to load contact features:', error);
  }
};

// Initialize when contact elements are found
const init = () => {
  const contactElements = document.querySelectorAll('form[data-contact-form], .turnstile-widget, .contact-form');
  if (contactElements.length > 0) {
    initContactFeatures();
  }
};

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};