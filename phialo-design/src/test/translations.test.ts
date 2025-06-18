import { describe, it, expect } from 'vitest';
import { translations } from '../lib/translations';
import { LOCALES } from '../lib/i18n';

describe('Translation Completeness', () => {
  const getAllKeys = (obj: any, prefix = ''): string[] => {
    let keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  };

  it('should have all locales defined', () => {
    LOCALES.forEach(locale => {
      expect(translations).toHaveProperty(locale);
      expect(translations[locale]).toBeDefined();
    });
  });

  it('should have matching translation keys between locales', () => {
    const englishKeys = getAllKeys(translations.en).sort();
    const germanKeys = getAllKeys(translations.de).sort();
    
    expect(germanKeys).toEqual(englishKeys);
  });

  it('should have no empty translations', () => {
    LOCALES.forEach(locale => {
      const keys = getAllKeys(translations[locale]);
      
      keys.forEach(key => {
        const value = key.split('.').reduce((obj: any, k) => obj?.[k], translations[locale]);
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should have proper German translations (not just English)', () => {
    // Check some key translations are actually different between languages
    expect((translations.de.nav as any).services).toBe('3D für Sie');
    expect((translations.en.nav as any).services).toBe('3D for You');
    
    expect((translations.de.nav as any).about).toBe('Über uns');
    expect((translations.en.nav as any).about).toBe('About');
    
    expect((translations.de.nav as any).contact).toBe('Kontakt');
    expect((translations.en.nav as any).contact).toBe('Contact');
  });

  it('should have consistent key structure', () => {
    const requiredSections = [
      'site',
      'nav', 
      'home',
      'services',
      'portfolio',
      'tutorials',
      'about',
      'contact',
      'common'
    ];

    LOCALES.forEach(locale => {
      requiredSections.forEach(section => {
        expect(translations[locale]).toHaveProperty(section);
      });
    });
  });

  it('should have proper meta tags for all pages', () => {
    const pageKeys = ['portfolio', 'services', 'tutorials', 'about', 'contact'];
    
    LOCALES.forEach(locale => {
      pageKeys.forEach(page => {
        expect((translations[locale] as any)[page]).toHaveProperty('title');
        expect((translations[locale] as any)[page]).toHaveProperty('description');
      });
    });
  });

  it('should have consistent navigation structure', () => {
    const navKeys = ['home', 'portfolio', 'services', 'tutorials', 'about', 'contact', 'language'];
    
    LOCALES.forEach(locale => {
      navKeys.forEach(key => {
        expect((translations[locale].nav as any)).toHaveProperty(key);
      });
    });
  });

  it('should have hero sections for all main pages', () => {
    const pagesWithHero = ['services', 'portfolio', 'tutorials', 'about', 'contact'];
    
    LOCALES.forEach(locale => {
      pagesWithHero.forEach(page => {
        expect((translations[locale] as any)[page]).toHaveProperty('hero');
        expect((translations[locale] as any)[page].hero).toHaveProperty('title');
        expect((translations[locale] as any)[page].hero).toHaveProperty('subtitle');
      });
    });
  });

  it('should have German umlaut characters where appropriate', () => {
    // Check that German translations use proper German characters
    const germanText = (translations.de.nav as any).about;
    expect(germanText).toBe('Über uns'); // Contains umlaut
    
    const servicesText = (translations.de.nav as any).services;
    expect(servicesText).toBe('3D für Sie'); // Contains umlaut
  });

  it('should use appropriate German formal/informal tone', () => {
    // German translations should use "Sie" (formal) for business context
    const germanService = (translations.de.services as any).title;
    expect(germanService).toBe('3D für Sie');
    
    // Check consistency in formal address
    const germanCallToAction = (translations.de.services as any).callToAction.subtitle;
    expect(germanCallToAction).toContain('Sie'); // Should use formal "Sie"
  });
});