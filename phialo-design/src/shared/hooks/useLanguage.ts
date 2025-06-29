import { useState, useEffect, useCallback, useMemo } from 'react';

// Type definitions
export type Language = 'en' | 'de';

interface Translations {
  [key: string]: {
    en: string;
    de: string;
  };
}

interface UseLanguageReturn {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, translations?: Translations) => string;
  isEnglish: boolean;
  getLocalizedPath: (path: string) => string;
}

// Constants
const STORAGE_KEY = 'preferred-language';
const DEFAULT_LANG: Language = 'de';

// Security: Validate that a path is safe for navigation (prevents open redirects)
function isValidPath(path: string): boolean {
  // Only allow relative paths that start with /
  if (!path.startsWith('/')) return false;
  
  // Prevent protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  
  // Prevent URLs with protocols
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false;
  
  // Additional safety: ensure path doesn't contain @, which could be used in URLs
  if (path.includes('@')) return false;
  
  return true;
}

// Common translations that can be extended by components
const commonTranslations: Translations = {
  // Navigation
  'nav.portfolio': { en: 'Portfolio', de: 'Portfolio' },
  'nav.services': { en: '3D for You', de: '3D für Sie' },
  'nav.tutorials': { en: 'Tutorials', de: 'Tutorials' },
  'nav.about': { en: 'About Me', de: 'Über mich' },
  'nav.contact': { en: 'Contact', de: 'Kontakt' },
  
  // Common UI elements
  'common.readMore': { en: 'Read more', de: 'Mehr erfahren' },
  'common.close': { en: 'Close', de: 'Schließen' },
  'common.openMenu': { en: 'Open menu', de: 'Menü öffnen' },
  'common.closeMenu': { en: 'Close menu', de: 'Menü schließen' },
  'common.loading': { en: 'Loading...', de: 'Laden...' },
  'common.error': { en: 'An error occurred', de: 'Ein Fehler ist aufgetreten' },
  
  // Portfolio
  'portfolio.all': { en: 'All', de: 'Alle' },
  'portfolio.rings': { en: 'Rings', de: 'Ringe' },
  'portfolio.earrings': { en: 'Earrings', de: 'Ohrringe' },
  'portfolio.sculptures': { en: 'Sculptures', de: 'Skulpturen' },
  'portfolio.year': { en: 'Year', de: 'Jahr' },
  'portfolio.materials': { en: 'Materials', de: 'Materialien' },
  'portfolio.techniques': { en: 'Techniques', de: 'Techniken' },
  'portfolio.details': { en: 'Details', de: 'Details' },
};

/**
 * Enhanced language hook that consolidates language detection, persistence, and translation
 * 
 * @param componentTranslations - Optional component-specific translations to merge with common ones
 * @returns Object with current language, setters, translation function, and utilities
 */
export function useLanguage(componentTranslations?: Translations): UseLanguageReturn {
  const [lang, setLang] = useState<Language>(DEFAULT_LANG);
  const [isInitialized, setIsInitialized] = useState(false);

  // Merge translations
  const translations = useMemo(
    () => ({ ...commonTranslations, ...componentTranslations }),
    [componentTranslations]
  );

  // Initialize language from URL and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect language from URL
      const pathname = window.location.pathname;
      const urlLang: Language = pathname.startsWith('/en') ? 'en' : 'de';
      
      // Check localStorage for preference
      try {
        const storedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
        
        // URL takes precedence over stored preference (user explicitly navigated)
        // But only update if we're not on the homepage
        const isHomepage = pathname === '/' || pathname === '/en/' || pathname === '/en';
        
        if (!isHomepage) {
          // User is on a specific page, respect the URL language
          setLang(urlLang);
          // Update stored preference to match current navigation
          if (storedLang !== urlLang) {
            localStorage.setItem(STORAGE_KEY, urlLang);
          }
        } else if (storedLang && storedLang !== urlLang) {
          // On homepage with different stored preference, redirect
          const targetUrl = storedLang === 'en' ? '/en/' : '/';
          // Security: validate URL before navigation
          if (isValidPath(targetUrl)) {
            window.location.replace(targetUrl);
          }
          return;
        } else {
          // No stored preference or matches URL
          setLang(urlLang);
        }
      } catch (error) {
        console.warn('Could not access localStorage:', error);
        setLang(urlLang);
      }
      
      setIsInitialized(true);
    }
  }, []);

  // Update language and persist to localStorage
  const setLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
    
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (error) {
      console.warn('Could not save language preference:', error);
    }
    
    // Navigate to the appropriate URL
    const currentPath = window.location.pathname;
    const isCurrentlyEnglish = currentPath.startsWith('/en');
    
    if (newLang === 'en' && !isCurrentlyEnglish) {
      const newPath = '/en' + currentPath;
      // Security: validate URL before navigation
      if (isValidPath(newPath)) {
        window.location.href = newPath;
      }
    } else if (newLang === 'de' && isCurrentlyEnglish) {
      const newPath = currentPath.replace(/^\/en/, '') || '/';
      // Security: validate URL before navigation
      if (isValidPath(newPath)) {
        window.location.href = newPath;
      }
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key: string, customTranslations?: Translations): string => {
      const translationSource = customTranslations || translations;
      const translation = translationSource[key];
      
      if (!translation) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      
      return translation[lang] || translation[DEFAULT_LANG] || key;
    },
    [lang, translations]
  );

  // Get localized path
  const getLocalizedPath = useCallback(
    (path: string): string => {
      // Ensure path starts with /
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Add language prefix for English
      return lang === 'en' ? `/en${normalizedPath}` : normalizedPath;
    },
    [lang]
  );

  // Convenience boolean for English detection
  const isEnglish = lang === 'en';

  return {
    lang,
    setLanguage,
    t,
    isEnglish,
    getLocalizedPath,
  };
}

// Export type and constants for use in other components
export type { Translations, UseLanguageReturn };
export { STORAGE_KEY, DEFAULT_LANG, commonTranslations };
