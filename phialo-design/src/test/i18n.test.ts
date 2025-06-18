import { describe, it, expect } from 'vitest';
import { 
  getLocaleFromUrl, 
  createT, 
  getLocalizedUrl, 
  getTranslation,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale 
} from '../lib/i18n';
import { translations } from '../lib/translations';

describe('i18n utilities', () => {
  describe('getLocaleFromUrl', () => {
    it('should return default locale for root path', () => {
      const url = new URL('https://example.com/');
      expect(getLocaleFromUrl(url)).toBe('en');
    });

    it('should return default locale for English paths', () => {
      const url = new URL('https://example.com/portfolio');
      expect(getLocaleFromUrl(url)).toBe('en');
    });

    it('should return correct locale for German paths', () => {
      const url = new URL('https://example.com/de/portfolio');
      expect(getLocaleFromUrl(url)).toBe('de');
    });

    it('should return default locale for invalid locale in path', () => {
      const url = new URL('https://example.com/fr/portfolio');
      expect(getLocaleFromUrl(url)).toBe('en');
    });

    it('should handle complex paths correctly', () => {
      const url = new URL('https://example.com/de/portfolio/category/item');
      expect(getLocaleFromUrl(url)).toBe('de');
    });

    it('should handle trailing slashes', () => {
      const url = new URL('https://example.com/de/');
      expect(getLocaleFromUrl(url)).toBe('de');
    });
  });

  describe('getTranslation', () => {
    it('should return correct English translation', () => {
      const translation = getTranslation('en', 'nav.home', translations);
      expect(translation).toBe('Home');
    });

    it('should return correct German translation', () => {
      const translation = getTranslation('de', 'nav.home', translations);
      expect(translation).toBe('Home');
    });

    it('should handle nested translation keys', () => {
      const translation = getTranslation('en', 'services.hero.title', translations);
      expect(translation).toBe('3D for You');
    });

    it('should fall back to default locale for missing translations', () => {
      const mockTranslations = {
        en: { test: 'English test' },
        de: {}
      };
      const translation = getTranslation('de', 'test', mockTranslations);
      expect(translation).toBe('English test');
    });

    it('should return key if translation not found', () => {
      const translation = getTranslation('en', 'nonexistent.key', translations);
      expect(translation).toBe('nonexistent.key');
    });

    it('should handle deep nested keys', () => {
      const translation = getTranslation('en', 'home.overview.portfolio.title', translations);
      expect(translation).toBe('Portfolio');
    });
  });

  describe('createT', () => {
    it('should create working translation function for English', () => {
      const t = createT('en', translations);
      expect(t('nav.portfolio')).toBe('Portfolio');
      expect(t('nav.services')).toBe('3D for You');
    });

    it('should create working translation function for German', () => {
      const t = createT('de', translations);
      expect(t('nav.portfolio')).toBe('Portfolio');
      expect(t('nav.services')).toBe('3D für Sie');
    });

    it('should handle missing keys gracefully', () => {
      const t = createT('en', translations);
      expect(t('missing.key')).toBe('missing.key');
    });
  });

  describe('getLocalizedUrl', () => {
    it('should return root path for English default locale', () => {
      const url = getLocalizedUrl('en', '/');
      expect(url).toBe('/');
    });

    it('should add language prefix for German', () => {
      const url = getLocalizedUrl('de', '/');
      expect(url).toBe('/de/');
    });

    it('should handle complex paths for default locale', () => {
      const url = getLocalizedUrl('en', '/portfolio/category');
      expect(url).toBe('/portfolio/category');
    });

    it('should handle complex paths for German', () => {
      const url = getLocalizedUrl('de', '/portfolio/category');
      expect(url).toBe('/de/portfolio/category');
    });

    it('should remove current locale prefix when switching', () => {
      const url = getLocalizedUrl('en', '/de/portfolio', 'de');
      expect(url).toBe('/portfolio');
    });

    it('should switch between locales correctly', () => {
      const url = getLocalizedUrl('de', '/portfolio', 'en');
      expect(url).toBe('/de/portfolio');
    });

    it('should handle paths without leading slash', () => {
      const url = getLocalizedUrl('de', 'portfolio');
      expect(url).toBe('/de/portfolio');
    });

    it('should handle empty paths', () => {
      const url = getLocalizedUrl('de', '');
      expect(url).toBe('/de/');
    });
  });

  describe('locale constants', () => {
    it('should have correct default locale', () => {
      expect(DEFAULT_LOCALE).toBe('en');
    });

    it('should have correct locales array', () => {
      expect(LOCALES).toEqual(['en', 'de']);
    });

    it('should include default locale in locales array', () => {
      expect(LOCALES).toContain(DEFAULT_LOCALE);
    });
  });
});