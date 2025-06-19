import { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  weglotApiKey?: string | null;
}

interface Language {
  code: string;
  label: string;
  locale: string;
}

const languages: Language[] = [
  { code: 'DE', label: 'Deutsch', locale: 'de' },
  { code: 'EN', label: 'English', locale: 'en' }
];

export default function LanguageSelector({ weglotApiKey }: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState('DE');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const translationInitializedRef = useRef<boolean>(false);
  const pageTransitionCountRef = useRef<number>(0);
  
  // Initial setup - load preference and add event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('🌐 LanguageSelector: Initial mount setup');
    
    // Load saved language preference
    const storedLanguage = localStorage.getItem('preferred-language');
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
    
    // Create necessary elements if they don't exist
    if (!document.getElementById('weglot-switcher')) {
      const weglotEl = document.createElement('div');
      weglotEl.id = 'weglot-switcher';
      weglotEl.className = 'hidden';
      document.body.appendChild(weglotEl);
    }
    
    if (!document.getElementById('google-translate-element')) {
      const googleEl = document.createElement('div');
      googleEl.id = 'google-translate-element';
      googleEl.className = 'hidden';
      document.body.appendChild(googleEl);
    }
    
    // Initialize translation service
    initializeTranslation();
    
    // Apply stored language with a delay to ensure initialization completes
    setTimeout(() => {
      if (storedLanguage) {
        const language = languages.find(l => l.code === storedLanguage);
        if (language) {
          applyLanguage(language);
        }
      }
    }, 500);
    
    // Setup page transition event handler
    const handlePageTransition = () => {
      // Increment transition count to track navigation
      pageTransitionCountRef.current += 1;
      const currentTransitionCount = pageTransitionCountRef.current;
      
      console.log(`🌐 LanguageSelector: Page transition detected #${currentTransitionCount}`);
      
      // Reset translation elements to force reinitialization
      resetTranslationElements();
      
      // Re-initialize translation after a short delay
      setTimeout(() => {
        // Only process if this is still the most recent transition
        if (currentTransitionCount === pageTransitionCountRef.current) {
          console.log(`🌐 LanguageSelector: Reinitializing translation after transition #${currentTransitionCount}`);
          initializeTranslation();
          
          // Apply stored language after a delay
          setTimeout(() => {
            const storedLang = localStorage.getItem('preferred-language');
            if (storedLang) {
              const lang = languages.find(l => l.code === storedLang);
              if (lang) {
                console.log(`🌐 LanguageSelector: Reapplying stored language ${lang.code} after transition`);
                applyLanguage(lang);
              }
            }
          }, 300);
        }
      }, 100);
    };
    
    // Listen for Astro page transitions - handle both events for maximum compatibility
    document.addEventListener('astro:page-load', handlePageTransition);
    document.addEventListener('astro:after-swap', handlePageTransition);
    
    return () => {
      document.removeEventListener('astro:page-load', handlePageTransition);
      document.removeEventListener('astro:after-swap', handlePageTransition);
    };
  }, [weglotApiKey]);
  
  // Reset translation elements for a clean initialization
  const resetTranslationElements = () => {
    // Clear weglot element
    const weglotEl = document.getElementById('weglot-switcher');
    if (weglotEl) {
      weglotEl.innerHTML = '';
    }
    
    // Clear Google Translate element
    const googleEl = document.getElementById('google-translate-element');
    if (googleEl) {
      googleEl.innerHTML = '';
    }
  };
  
  // Initialize appropriate translation service
  const initializeTranslation = () => {
    console.log('🌐 LanguageSelector: Initializing translation service');
    
    if (weglotApiKey && weglotApiKey !== 'your-api-key-here') {
      initializeWeglot(weglotApiKey);
    } else {
      initializeGoogleTranslate();
    }
  };
  
  // Apply language change to active translation service
  const applyLanguage = (language: Language) => {
    if (typeof window === 'undefined') return;
    
    console.log(`🌐 LanguageSelector: Applying language ${language.code} (${language.locale})`);
    
    // Try Weglot first
    if ((window as any).Weglot) {
      try {
        console.log('🌐 LanguageSelector: Using Weglot for language change');
        (window as any).Weglot.switchTo(language.locale);
      } catch (e) {
        console.warn('⚠️ LanguageSelector: Error switching Weglot language:', e);
        // Try reinitializing if switching fails
        if (weglotApiKey) {
          console.log('🌐 LanguageSelector: Attempting to recover Weglot');
          setTimeout(() => initializeWeglot(weglotApiKey), 100);
        }
      }
    } 
    // Fallback to Google Translate
    else if ((window as any).google?.translate) {
      try {
        console.log('🌐 LanguageSelector: Using Google Translate for language change');
        const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (googleTranslateCombo) {
          googleTranslateCombo.value = language.locale;
          googleTranslateCombo.dispatchEvent(new Event('change'));
        } else {
          console.warn('⚠️ LanguageSelector: Google translate combo element not found');
        }
      } catch (e) {
        console.warn('⚠️ LanguageSelector: Error switching Google Translate language:', e);
        // Try reinitializing if switching fails
        setTimeout(() => initializeGoogleTranslate(), 100);
      }
    } else {
      console.warn('⚠️ LanguageSelector: No translation service is available');
      // Reinitialize translation service      setTimeout(() => initializeTranslation(), 100);
    }
  };
  
  const initializeWeglot = (apiKey: string) => {
    if (typeof window === 'undefined') return;
    
    console.log('🌐 LanguageSelector: Initializing Weglot');
    
    // Clean up previous instance
    try {
      if ((window as any).Weglot && typeof (window as any).Weglot.destroy === 'function') {
        (window as any).Weglot.destroy();
      }
    } catch (e) {
      console.warn('⚠️ LanguageSelector: Error cleaning up Weglot:', e);
    }
    
    // Add Weglot CSS if it doesn't exist
    if (!document.querySelector('link[href*="weglot.min.css"]')) {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = `https://cdn.weglot.com/weglot.min.css?_t=${Date.now()}`;
      document.head.appendChild(styleLink);
    }
    
    // Remove any existing Weglot scripts to avoid conflicts
    const existingWeglotScripts = document.querySelectorAll('script[src*="weglot.min.js"]');
    existingWeglotScripts.forEach(script => script.remove());
    
    // Create and add Weglot script with unique parameter to prevent caching
    const script = document.createElement('script');
    script.src = `https://cdn.weglot.com/weglot.min.js?_t=${Date.now()}`;
    script.async = true;
    
    script.onload = () => {
      // Wait a short time to ensure script is fully initialized
      setTimeout(() => {
        try {
          if ((window as any).Weglot) {
            console.log('🌐 LanguageSelector: Weglot script loaded, initializing');
            (window as any).Weglot.initialize({
              api_key: apiKey,
              original_language: 'de',
              destination_languages: languages.map(l => l.locale).filter(l => l !== 'de').join(','),
              switchers: [{
                target: '#weglot-switcher',
                sibling: null
              }],
              auto_switch: false // Disable auto switch to ensure we control the flow
            });
            
            // Mark translation as initialized
            translationInitializedRef.current = true;
            
            // If we have a stored language, apply it after a short delay
            const storedLanguage = localStorage.getItem('preferred-language');
            if (storedLanguage) {
              const langObj = languages.find(l => l.code === storedLanguage);
              if (langObj && langObj.locale !== 'de') {
                setTimeout(() => {
                  try {
                    console.log(`🌐 LanguageSelector: Applying stored language ${langObj.code} to Weglot`);
                    (window as any).Weglot.switchTo(langObj.locale);
                  } catch (e) {
                    console.warn('⚠️ LanguageSelector: Error applying stored language to Weglot:', e);
                  }
                }, 300);
              }
            }
          }
        } catch (e) {
          console.error('⚠️ LanguageSelector: Failed to initialize Weglot:', e);
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('⚠️ LanguageSelector: Failed to load Weglot script:', error);
    };
      document.head.appendChild(script);
  };
  
  const initializeGoogleTranslate = () => {
    if (typeof window === 'undefined') return;
    
    console.log('🌐 LanguageSelector: Initializing Google Translate');
    
    // Clean up previous instance
    const googleTranslateElement = document.getElementById('google-translate-element');
    
    // Clean up existing iframes to avoid conflicts
    const googleFrames = document.querySelectorAll('iframe.goog-te-menu-frame, iframe.goog-te-banner-frame');
    googleFrames.forEach(frame => frame.remove());
    
    // Clean up existing translate scripts
    const existingGoogleScripts = document.querySelectorAll('script[src*="translate_a/element.js"]');
    existingGoogleScripts.forEach(script => script.remove());
    
    // Clear the Google Translate element
    if (googleTranslateElement) {
      googleTranslateElement.innerHTML = '';
    }
    
    // Set up Google Translate initialization function
    (window as any).googleTranslateElementInit = () => {
      try {
        console.log('🌐 LanguageSelector: Google Translate callback executing');
        
        // Initialize the translate widget
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'de',
          includedLanguages: languages.map(l => l.locale).join(','),
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google-translate-element');
        
        // Mark translation as initialized
        translationInitializedRef.current = true;
        
        // Apply stored language after a delay
        const storedLanguage = localStorage.getItem('preferred-language');
        if (storedLanguage) {
          const langObj = languages.find(l => l.code === storedLanguage);
          if (langObj && langObj.locale !== 'de') {
            setTimeout(() => {
              try {
                console.log(`🌐 LanguageSelector: Applying stored language ${langObj.code} to Google Translate`);
                const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                if (googleTranslateCombo) {
                  googleTranslateCombo.value = langObj.locale;
                  googleTranslateCombo.dispatchEvent(new Event('change'));
                } else {
                  console.warn('⚠️ LanguageSelector: Google translate combo element not found');
                }
              } catch (e) {
                console.warn('⚠️ LanguageSelector: Error applying stored language to Google Translate:', e);
              }
            }, 500);
          }
        }
      } catch (e) {
        console.error('⚠️ LanguageSelector: Failed to initialize Google Translate:', e);
      }
    };
    
    // Load the Google Translate script with unique parameter to prevent caching
    const script = document.createElement('script');
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&_t=${Date.now()}`;
    script.async = true;
    
    script.onerror = (error) => {
      console.error('⚠️ LanguageSelector: Failed to load Google Translate script:', error);
    };
      document.head.appendChild(script);
  };
  
  const handleLanguageChange = (language: Language) => {
    console.log(`🌐 LanguageSelector: User selected language ${language.code}`);
    
    // Update state and close dropdown
    setCurrentLanguage(language.code);
    setIsDropdownOpen(false);
    
    // Store preference in localStorage for persistence
    localStorage.setItem('preferred-language', language.code);
    
    // Apply the language change
    applyLanguage(language);
  };

  return (
    <div className="relative">
      {/* Hidden Translation Elements */}
      <div id="weglot-switcher" className="hidden"></div>
      <div id="google-translate-element" className="hidden"></div>
      
      {/* Custom Language Selector */}
      <div className="flex items-center">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-midnight transition-colors duration-200"
          aria-label="Select language"
        >
          <Globe size={16} />
          <span>{currentLanguage}</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage === language.code 
                    ? 'text-gold font-semibold bg-gold/5' 
                    : 'text-gray-700'
                }`}
              >
                <span className="font-medium">{language.code}</span>
                <span className="ml-2 text-xs opacity-75">{language.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}