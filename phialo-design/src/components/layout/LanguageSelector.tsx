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
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applyLanguageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to get current display language
  const getCurrentDisplayLanguage = () => {
    if ((window as any).Weglot && (window as any).Weglot.getCurrentLang) {
      const lang = (window as any).Weglot.getCurrentLang();
      return lang === 'de' ? 'DE' : 'EN';
    }
    return 'DE';
  };
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load saved language preference from localStorage
    const storedLanguage = localStorage.getItem('preferred-language');
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }
    
    // Flag to track if this component has been initialized
    let hasInitialized = false;
    
    // Sync displayed language with actual translation state
    const syncDisplayLanguage = () => {
      const actualLang = getCurrentDisplayLanguage();
      if (actualLang !== currentLanguage) {
        console.log(`🌐 LanguageSelector: Syncing display language from ${currentLanguage} to ${actualLang}`);
        setCurrentLanguage(actualLang);
      }
    };

    const handleInitialLoad = () => {
      if (hasInitialized) return;
      hasInitialized = true;
      
      console.log('🌐 LanguageSelector: Initial component load - initializing Weglot');

      // Ensure placeholder element exists for Weglot
      if (!document.getElementById('weglot-switcher')) {
        const weglotEl = document.createElement('div');
        weglotEl.id = 'weglot-switcher';
        weglotEl.className = 'hidden';
        document.body.appendChild(weglotEl);
      }

      initializeTranslation();
    };

    const handlePageLoad = () => {
      console.log('🌐 LanguageSelector: Astro page load event - ensuring Weglot is active');
      
      // Ensure placeholder element exists for Weglot
      if (!document.getElementById('weglot-switcher')) {
        const weglotEl = document.createElement('div');
        weglotEl.id = 'weglot-switcher';
        weglotEl.className = 'hidden';
        document.body.appendChild(weglotEl);
      }

      // Check if Weglot needs to be applied after navigation
      const needsReapplication = !isTranslationServiceActive();
      console.log(`🌐 LanguageSelector: Weglot needs reapplication: ${needsReapplication}`);
      
      if (needsReapplication) {
        // If Weglot is not active or in wrong state, re-apply the stored language
        const storedLanguage = localStorage.getItem('preferred-language');
        if (storedLanguage) {
          console.log(`🌐 LanguageSelector: Re-applying stored language: ${storedLanguage}`);
          const langObj = languages.find(l => l.code === storedLanguage);
          if (langObj) {
            // Wait for page to be fully loaded, then apply language
            setTimeout(() => {
              applyLanguageWithRetry(langObj, 3);
            }, 100);
          }
        }
      } else {
        // Weglot is active, just sync the display
        syncDisplayLanguage();
      }
    };
    
    // Apply language with retry mechanism for navigation
    const applyLanguageWithRetry = (language: Language, retries: number) => {
      if (retries <= 0) {
        console.warn('⚠️ LanguageSelector: Failed to apply language after retries');
        return;
      }
      
      if ((window as any).Weglot && typeof (window as any).Weglot.switchTo === 'function') {
        try {
          console.log(`🌐 LanguageSelector: Applying ${language.code} (${language.locale}) with ${retries} retries left`);
          (window as any).Weglot.switchTo(language.locale);
          
          // Verify the language was applied after a short delay
          setTimeout(() => {
            const currentLang = (window as any).Weglot?.getCurrentLang?.();
            if (currentLang !== language.locale) {
              console.log(`🌐 LanguageSelector: Language not applied correctly (${currentLang} !== ${language.locale}), retrying...`);
              applyLanguageWithRetry(language, retries - 1);
            } else {
              console.log(`🌐 LanguageSelector: Language ${language.code} applied successfully`);
              syncDisplayLanguage();
            }
          }, 200);
        } catch (e) {
          console.warn('⚠️ LanguageSelector: Error applying language, retrying...', e);
          setTimeout(() => applyLanguageWithRetry(language, retries - 1), 300);
        }
      } else {
        console.log('🌐 LanguageSelector: Weglot not ready, initializing first...');
        initializeTranslation();
        setTimeout(() => applyLanguageWithRetry(language, retries - 1), 500);
      }
    };

    // Handle initial load
    handleInitialLoad();

    // Listen for Astro navigation events
    document.addEventListener('astro:page-load', handlePageLoad);
    
    // Handle cleanup of timeouts on page swap
    const handleAfterSwap = () => {
      console.log('🌐 LanguageSelector: After swap event detected - clearing timeouts');
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (applyLanguageTimeoutRef.current) {
        clearTimeout(applyLanguageTimeoutRef.current);
      }
    };
    
    document.addEventListener('astro:after-swap', handleAfterSwap);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('astro:page-load', handlePageLoad);
      document.removeEventListener('astro:after-swap', handleAfterSwap);
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (applyLanguageTimeoutRef.current) {
        clearTimeout(applyLanguageTimeoutRef.current);
      }
    };
  }, [weglotApiKey]);
  
  // Check if Weglot is active and in the correct language state
  const isTranslationServiceActive = () => {
    if ((window as any).Weglot && typeof (window as any).Weglot.switchTo === 'function') {
      try {
        const currentLang = (window as any).Weglot.getCurrentLang?.();
        const storedLanguage = localStorage.getItem('preferred-language');
        
        console.log('🌐 LanguageSelector: Weglot check - current:', currentLang, 'stored:', storedLanguage);
        
        if (storedLanguage) {
          const expectedLang = storedLanguage === 'EN' ? 'en' : 'de';
          return currentLang === expectedLang;
        }
        
        return true;
      } catch (e) {
        console.log('🌐 LanguageSelector: Weglot present but not responsive');
        return false;
      }
    }
    
    return false;
  };
  
  
  // Initialize Weglot translation service
  const initializeTranslation = () => {
    console.log('🌐 LanguageSelector: Initializing Weglot translation service');
    
    if (weglotApiKey && weglotApiKey !== 'your-api-key-here') {
      initializeWeglot(weglotApiKey);
    } else {
      console.error('⚠️ LanguageSelector: No valid Weglot API key provided');
    }
  };
  
  // Apply language change using Weglot
  const applyLanguage = (language: Language) => {
    if (typeof window === 'undefined') return;
    
    console.log(`🌐 LanguageSelector: Applying language ${language.code} (${language.locale})`);
    
    if ((window as any).Weglot) {
      try {
        console.log('🌐 LanguageSelector: Using Weglot for language change');
        (window as any).Weglot.switchTo(language.locale);
      } catch (e) {
        console.warn('⚠️ LanguageSelector: Error switching Weglot language:', e);
      }
    } else {
      console.warn('⚠️ LanguageSelector: Weglot not available for language change');
    }
  };
  
  const initializeWeglot = (apiKey: string) => {
    if (typeof window === 'undefined') return;
    
    console.log('🌐 LanguageSelector: Initializing Weglot');
    
    // Only clean up if Weglot is in a broken state
    try {
      if ((window as any).Weglot && typeof (window as any).Weglot.getCurrentLang !== 'function') {
        console.log('🌐 LanguageSelector: Weglot in broken state, cleaning up');
        (window as any).Weglot.destroy();
      }
    } catch (e) {
      console.warn('⚠️ LanguageSelector: Error checking Weglot state:', e);
    }
    
    // Add Weglot CSS if it doesn't exist
    if (!document.querySelector('link[href*="weglot.min.css"]')) {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = 'https://cdn.weglot.com/weglot.min.css';
      document.head.appendChild(styleLink);
    }
    
    // Remove any existing Weglot scripts to avoid conflicts
    const existingWeglotScripts = document.querySelectorAll('script[src*="weglot.min.js"]');
    existingWeglotScripts.forEach(script => script.remove());
    
    // Create and add Weglot script
    const script = document.createElement('script');
    script.src = 'https://cdn.weglot.com/weglot.min.js';
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
            
            // Set up Weglot event listeners for better state management
            try {
              (window as any).Weglot.on('languageChanged', (newLang: string) => {
                console.log(`🌐 LanguageSelector: Weglot language changed to: ${newLang}`);
                const displayLang = newLang === 'en' ? 'EN' : 'DE';
                setCurrentLanguage(displayLang);
                localStorage.setItem('preferred-language', displayLang);
              });
            } catch (e) {
              console.warn('⚠️ LanguageSelector: Could not set up Weglot event listeners:', e);
            }
            
            // Apply stored language if different from default
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
      {/* Hidden Weglot Element */}
      <div id="weglot-switcher" className="hidden"></div>
      
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