import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  label: string;
  googleCode: string;
}

const languages: Language[] = [
  { code: 'DE', label: 'Deutsch', googleCode: 'de' },
  { code: 'EN', label: 'English', googleCode: 'en' }
];

export default function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState('DE');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Initialize Google Translate
    const initializeGoogleTranslate = () => {
      if (typeof window !== 'undefined' && !(window as any).google?.translate) {
        // Add Google Translate script
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);

        // Initialize Google Translate Widget
        (window as any).googleTranslateElementInit = () => {
          if ((window as any).google?.translate?.TranslateElement) {
            new (window as any).google.translate.TranslateElement({
              pageLanguage: 'de',
              includedLanguages: 'de,en',
              layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'google_translate_element');
          }
        };
      }
    };

    initializeGoogleTranslate();
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language.code);
    setIsDropdownOpen(false);

    // Trigger Google Translate
    if (typeof window !== 'undefined' && (window as any).google?.translate) {
      const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleTranslateCombo) {
        googleTranslateCombo.value = language.googleCode;
        googleTranslateCombo.dispatchEvent(new Event('change'));
      }
    }
  };

  return (
    <div className="relative">
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" className="hidden"></div>
      
      {/* Custom Language Selector */}
      <div className="flex items-center">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-midnight transition-colors duration-200"
          aria-label="Sprache auswählen"
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
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage === language.code 
                    ? 'text-gold font-semibold' 
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