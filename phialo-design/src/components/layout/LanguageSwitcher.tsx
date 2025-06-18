import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { getLocaleFromUrl, getLocalizedUrl, type Locale } from '../../lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [currentPath, setCurrentPath] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const locale = getLocaleFromUrl(url);
    setCurrentLocale(locale);
    setCurrentPath(url.pathname);
    
    // Update on navigation
    const handleLocationChange = () => {
      const newUrl = new URL(window.location.href);
      const newLocale = getLocaleFromUrl(newUrl);
      setCurrentLocale(newLocale);
      setCurrentPath(newUrl.pathname);
    };
    
    document.addEventListener('astro:page-load', handleLocationChange);
    
    return () => {
      document.removeEventListener('astro:page-load', handleLocationChange);
    };
  }, []);

  const handleLanguageSwitch = (newLocale: Locale) => {
    const localizedUrl = getLocalizedUrl(newLocale, currentPath, currentLocale);
    window.location.href = localizedUrl;
  };

  const languages = [
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
    { code: 'de' as Locale, name: 'Deutsch', flag: '🇩🇪' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-midnight transition-colors duration-200 rounded-md hover:bg-gray-50"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  handleLanguageSwitch(language.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center space-x-3 ${
                  language.code === currentLocale
                    ? 'bg-gold/10 text-midnight font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-midnight'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}