import { useState, useEffect } from 'react';

interface LanguageSelectorProps {
  weglotApiKey?: string | null;
}
import { Globe } from 'lucide-react';

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

  useEffect(() => {
    // Initialize translation system
    const initializeTranslation = () => {
      if (typeof window !== 'undefined') {
        if (weglotApiKey && weglotApiKey !== 'your-api-key-here') {
          initializeWeglot(weglotApiKey);
        } else {
          initializeGoogleTranslate();
        }
      }
    };
    initializeTranslation();
  }, [weglotApiKey]);
  const initializeWeglot = (apiKey: string) => {
    if (!(window as any).Weglot) {
      // Add Weglot CSS
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = 'https://cdn.weglot.com/weglot.min.css';
      document.head.appendChild(styleLink);
      
      // Add Weglot Script
      const script = document.createElement('script');
      script.src = 'https://cdn.weglot.com/weglot.min.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        if ((window as any).Weglot) {
          (window as any).Weglot.initialize({
            api_key: apiKey,
            original_language: 'de',
            destination_languages: 'en',
            switchers: [{
              target: '#weglot-switcher',
              sibling: null
            }]
          });
        }
      };
    }
  };

  const initializeGoogleTranslate = () => {
    if (!(window as any).google?.translate) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement({
            pageLanguage: 'de',
            includedLanguages: 'de,en',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google-translate-element');
        }
      };
    }
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language.code);
    setIsDropdownOpen(false);

    if (typeof window !== 'undefined') {
      // Try Weglot first
      if ((window as any).Weglot) {
        (window as any).Weglot.switchTo(language.locale);
      } 
      // Fallback to Google Translate
      else if ((window as any).google?.translate) {
        const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (googleTranslateCombo) {
          googleTranslateCombo.value = language.locale;
          googleTranslateCombo.dispatchEvent(new Event('change'));
        }
      }
    }
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