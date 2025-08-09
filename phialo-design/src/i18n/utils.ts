/**
 * i18n utility functions for Phialo Design
 */

import { type Language, defaultLang } from './ui';

/**
 * Get the language from a URL pathname
 * @param pathname The URL pathname
 * @returns The detected language or default language
 */
export function getLangFromUrl(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean);
  
  // Check if the first segment is 'en'
  if (segments[0] === 'en') {
    return 'en';
  }
  
  // Default to German
  return defaultLang;
}

/**
 * Get the language-aware URL for a given path
 * @param lang The language
 * @param path The path without language prefix
 * @returns The complete URL with language prefix if needed
 */
export function getLocalizedUrl(lang: Language, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // For German (default), no prefix needed
  if (lang === defaultLang) {
    return `/${cleanPath}`;
  }
  
  // For English, add /en/ prefix
  return `/${lang}/${cleanPath}`;
}

/**
 * Get the alternate language URL for the current page
 * @param currentLang The current language
 * @param currentPath The current path
 * @returns The URL for the alternate language
 */
export function getAlternateLanguageUrl(
  currentLang: Language,
  currentPath: string
): string {
  const alternateLang: Language = currentLang === 'de' ? 'en' : 'de';
  
  // Remove language prefix from current path
  let pathWithoutLang = currentPath;
  if (currentLang === 'en' && currentPath.startsWith('/en')) {
    pathWithoutLang = currentPath.slice(3) || '/';
  }
  
  return getLocalizedUrl(alternateLang, pathWithoutLang);
}

/**
 * Check if a language is supported
 * @param lang The language code to check
 * @returns True if the language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
  return lang === 'de' || lang === 'en';
}

/**
 * Get browser preferred language
 * @param acceptLanguageHeader The Accept-Language header
 * @returns The preferred supported language
 */
export function getBrowserLanguage(acceptLanguageHeader: string | null): Language {
  if (!acceptLanguageHeader) {
    return defaultLang;
  }
  
  // Parse Accept-Language header
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => lang.trim().split(';')[0].toLowerCase());
  
  // Check for German
  if (languages.some(lang => lang.startsWith('de'))) {
    return 'de';
  }
  
  // Check for English
  if (languages.some(lang => lang.startsWith('en'))) {
    return 'en';
  }
  
  return defaultLang;
}