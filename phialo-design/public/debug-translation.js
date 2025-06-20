// Debug script for translation system
(function() {
  console.log('=== Translation System Debug ===');
  
  // Check localStorage
  const storedLang = localStorage.getItem('preferred-language');
  console.log('Stored Language:', storedLang || 'Not set');
  
  // Check Weglot
  if (window.Weglot) {
    console.log('Weglot: Active');
    console.log('Weglot Current Language:', window.Weglot.getCurrentLang ? window.Weglot.getCurrentLang() : 'Unknown');
  } else {
    console.log('Weglot: Not loaded');
  }
  
  // Check Google Translate
  const googleCombo = document.querySelector('.goog-te-combo');
  if (googleCombo) {
    console.log('Google Translate: Active');
    console.log('Google Translate Current Value:', googleCombo.value || 'Default (German)');
  } else {
    console.log('Google Translate: Not loaded');
  }
  
  // Check for translation elements
  const weglotEl = document.getElementById('weglot-switcher');
  const googleEl = document.getElementById('google-translate-element');
  console.log('Weglot Element:', weglotEl ? 'Present' : 'Missing');
  console.log('Google Element:', googleEl ? 'Present' : 'Missing');
  
  // Listen for navigation events
  console.log('\n--- Listening for navigation events ---');
  
  document.addEventListener('astro:before-swap', () => {
    console.log('[Navigation] astro:before-swap fired');
  });
  
  document.addEventListener('astro:page-load', () => {
    console.log('[Navigation] astro:page-load fired');

    // === Robust, event-driven translation (re-)initialization ===
    // This ensures translation services are reliably initialized after navigation,
    // without arbitrary timeouts or unreliable workarounds.

    // --- Weglot ---
    if (window.Weglot && typeof window.Weglot.init === 'function') {
      // Re-initialize Weglot if needed (idempotent)
      try {
        window.Weglot.init();
        console.log('[Translation] Weglot initialized after navigation');
      } catch (e) {
        console.warn('[Translation] Weglot re-initialization error:', e);
      }
    }

    // --- Google Translate ---
    // Google Translate requires the widget to be present and initialized.
    // If the element exists but the widget is not initialized, re-initialize.
    const googleEl = document.getElementById('google-translate-element');
    if (googleEl && typeof window.google === 'object' && window.google.translate && window.google.translate.TranslateElement) {
      try {
        // Remove any previous widget to avoid duplicates
        googleEl.innerHTML = '';
        new window.google.translate.TranslateElement(
          {pageLanguage: 'de', autoDisplay: false},
          'google-translate-element'
        );
        console.log('[Translation] Google Translate initialized after navigation');
      } catch (e) {
        console.warn('[Translation] Google Translate re-initialization error:', e);
      }
    }

    // Debug: Log translation status after navigation
    const postNavLang = localStorage.getItem('preferred-language');
    console.log('Language in localStorage:', postNavLang);

    if (window.Weglot) {
      console.log('Weglot still active');
    }

    const postNavCombo = document.querySelector('.goog-te-combo');
    if (postNavCombo) {
      console.log('Google Translate combo value:', postNavCombo.value);
    }
  });
  
  console.log('\nTo manually test language switching:');
  console.log('1. Click the language selector');
  console.log('2. Choose a language');
  console.log('3. Navigate to another page');
  console.log('4. Check if translation persists');
})();