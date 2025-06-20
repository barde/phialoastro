// Debug script for Weglot translation system
(function() {
  console.log('=== Weglot Translation System Debug ===');
  
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
  
  // Check for Weglot element
  const weglotEl = document.getElementById('weglot-switcher');
  console.log('Weglot Element:', weglotEl ? 'Present' : 'Missing');
  
  // Listen for navigation events
  console.log('\n--- Listening for navigation events ---');
  
  document.addEventListener('astro:before-swap', () => {
    console.log('[Navigation] astro:before-swap fired');
  });
  
  document.addEventListener('astro:page-load', () => {
    console.log('[Navigation] astro:page-load fired');

    // === Robust Weglot re-initialization ===
    // This ensures Weglot is reliably initialized after navigation

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

    // Debug: Log translation status after navigation
    const postNavLang = localStorage.getItem('preferred-language');
    console.log('Language in localStorage:', postNavLang);

    if (window.Weglot) {
      console.log('Weglot still active');
      console.log('Current Weglot language:', window.Weglot.getCurrentLang ? window.Weglot.getCurrentLang() : 'Unknown');
    }
  });
  
  console.log('\nTo manually test Weglot language switching:');
  console.log('1. Click the language selector');
  console.log('2. Choose a language (DE/EN)');
  console.log('3. Navigate to another page');
  console.log('4. Check if Weglot translation persists');
})();