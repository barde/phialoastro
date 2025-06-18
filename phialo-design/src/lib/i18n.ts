export type Locale = 'en' | 'de';

export const LOCALES: Locale[] = ['en', 'de'];

export const DEFAULT_LOCALE: Locale = 'en';

export interface TranslationObject {
  [key: string]: string | TranslationObject;
}

export interface Translations {
  [locale: string]: TranslationObject;
}

// Translation utility function
export function getTranslation(locale: Locale, key: string, translations: Translations): string {
  const localeTranslations = translations[locale] || translations[DEFAULT_LOCALE];
  
  // Support nested keys with dot notation (e.g., 'nav.home')
  const keys = key.split('.');
  let value: any = localeTranslations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
}

// Helper to create translation function for specific locale
export function createT(locale: Locale, translations: Translations) {
  return (key: string): string => getTranslation(locale, key, translations);
}

// Extract locale from URL pathname
export function getLocaleFromUrl(url: URL): Locale {
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length > 0 && LOCALES.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  
  return DEFAULT_LOCALE;
}

// Generate localized URLs
export function getLocalizedUrl(locale: Locale, path: string, currentLocale?: Locale): string {
  // Remove leading slash and current locale prefix if present
  let cleanPath = path.replace(/^\//, '');
  
  if (currentLocale && currentLocale !== DEFAULT_LOCALE) {
    cleanPath = cleanPath.replace(new RegExp(`^${currentLocale}/?`), '');
  }
  
  // Add locale prefix for non-default locales
  if (locale !== DEFAULT_LOCALE) {
    return `/${locale}/${cleanPath}`;
  }
  
  return `/${cleanPath}`;
}