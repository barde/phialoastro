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
  const navigationCountRef = useRef<number>(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load saved language preference from localStorage
    const storedLanguage = localStorage.getItem('preferred-language');
    if (storedLanguage) {
      setCurrentLanguage(storedLanguage);
    }

    const initAndApply = () => {
      console.log('🌐 LanguageSelector: Page load detected. Initializing translation.');

      // Ensure placeholder elements exist for translation libraries
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

      // Track navigation count to determine if this is first load or navigation
      navigationCountRef.current++;
      const isFirstLoad = navigationCountRef.current === 1;

      // Always initialize on first load, or if service is not active
      if (isFirstLoad || !isTranslationServiceActive()) {
        initializeTranslation();
      } else {
        // For subsequent navigations, just reapply the current language
        console.log('🌐 LanguageSelector: Reapplying language after navigation');
        const storedLang = localStorage.getItem('preferred-language');
        if (storedLang) {
          const langObj = languages.find(l => l.code === storedLang);
          if (langObj) {
            // Delay to ensure DOM is ready
            setTimeout(() => {
              applyLanguage(langObj);
            }, 200);
          }
        }
      }
    };

    // Run initialization on the first mount
    initAndApply();

    // Re-run initialization on subsequent page loads via Astro's view transitions
    document.addEventListener('astro:page-load', initAndApply);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('astro:page-load', initAndApply);
    };
  }, [weglotApiKey]);
  
  // Check if a translation service is currently active
  const isTranslationServiceActive = () => {
    // Check for Weglot
    if ((window as any).Weglot) {
      return true;
    }
    
    // Check for Google Translate - look for the combo box or translate element
    const googleCombo = document.querySelector('.goog-te-combo');
    const googleTranslateFrame = document.querySelector('.goog-te-menu-frame');
    
    return !!(googleCombo || googleTranslateFrame || (window as any).google?.translate);
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
      }
    }
    // Fallback to Google Translate
    else {
      try {
        console.log('🌐 LanguageSelector: Using Google Translate for language change');
        const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (googleTranslateCombo) {
          // For German, we need to reset to the original state
          if (language.locale === 'de') {
            // Click the "Show original" button if it exists
            const showOriginalButton = document.querySelector('.goog-te-banner a') as HTMLElement;
            if (showOriginalButton) {
              showOriginalButton.click();
            } else {
              // Reset by selecting the empty option
              googleTranslateCombo.value = '';
              googleTranslateCombo.dispatchEvent(new Event('change'));
            }
          } else {
            googleTranslateCombo.value = language.locale;
            googleTranslateCombo.dispatchEvent(new Event('change'));
          }
        } else {
          console.warn('⚠️ LanguageSelector: Google translate combo element not found');
          // If combo not found, might need to wait for Google Translate to initialize
          setTimeout(() => {
            const retryCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (retryCombo) {
              if (language.locale === 'de') {
                retryCombo.value = '';
              } else {
                retryCombo.value = language.locale;
              }
              retryCombo.dispatchEvent(new Event('change'));
            }
          }, 500);
        }
      } catch (e) {
        console.warn('⚠️ LanguageSelector: Error switching Google Translate language:', e);
      }
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
    
    // Load the Google Translate script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
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