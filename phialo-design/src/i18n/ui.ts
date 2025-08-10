/**
 * Centralized UI translations for the Phialo Design website
 * This file contains all UI strings used across the application
 */

export const languages = {
  de: 'Deutsch',
  en: 'English',
} as const;

export type Language = keyof typeof languages;

export const defaultLang: Language = 'de';

export const ui = {
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.about': 'Über uns',
    'nav.portfolio': 'Portfolio',
    'nav.services': 'Leistungen',
    'nav.classes': 'Kurse',
    'nav.contact': 'Kontakt',
    'nav.legal': 'Rechtliches',
    'nav.privacy': 'Datenschutz',
    'nav.terms': 'AGB',
    'nav.imprint': 'Impressum',
    
    // About Page
    'about.title': 'Über Phialo',
    'about.description': 'Entdecken Sie die Geschichte und Vision hinter Phialo Design - Ihre Experten für hochwertigen, handgefertigten Schmuck.',
    'about.heading': 'Über Phialo',
    'about.intro': 'Willkommen bei Phialo Design, wo jedes Schmuckstück eine Geschichte erzählt. Mit über 20 Jahren Erfahrung in der Schmuckherstellung verbinden wir traditionelle Handwerkskunst mit zeitgenössischem Design.',
    'about.philosophy': 'Unsere Philosophie ist einfach: Jedes Stück sollte zeitlos, elegant und einzigartig sein. Wir glauben an die Schönheit der Einfachheit und die Kraft des Details.',
    'about.materials': 'Wir arbeiten ausschließlich mit den feinsten Materialien - von konfliktfreien Diamanten bis zu ethisch gewonnenem Gold und Silber. Nachhaltigkeit und Qualität stehen im Mittelpunkt unseres Schaffens.',
    'about.team.heading': 'Unser Team',
    'about.team.founder': 'Gründerin & Designerin',
    'about.team.cofounder': 'Co-Founder & IT',
    'about.team.founder.bio': 'Mit einer Leidenschaft für zeitloses Design und nachhaltigen Luxus leitet Gesa Meise die kreative Vision von Phialo Design. Ihre langjährige Erfahrung in traditionellen Goldschmiedetechniken verbindet sie mit modernen Designansätzen.',
    'about.team.cofounder.bio': 'Als technischer Visionär bringt Bartholomäus Dedersen digitale Innovation zu Phialo Design. Seine Expertise in modernen Technologien ermöglicht es uns, traditionelles Handwerk mit digitaler Exzellenz zu verbinden.',
    
    // Contact Page
    'contact.title': 'Kontakt - Phialo Design',
    'contact.description': 'Nehmen Sie Kontakt mit uns auf für individuelle Schmuckanfertigungen oder Fragen zu unseren Kollektionen.',
    'contact.heading': 'Kontakt',
    'contact.subtitle': 'Wir freuen uns von Ihnen zu hören',
    'contact.phone': 'Telefon',
    'contact.email': 'E-Mail',
    'contact.form.name': 'Name',
    'contact.form.email': 'E-Mail',
    'contact.form.message': 'Nachricht',
    'contact.form.submit': 'Nachricht senden',
    'contact.form.sending': 'Wird gesendet...',
    'contact.form.success': 'Vielen Dank für Ihre Nachricht! Wir werden uns schnellstmöglich bei Ihnen melden.',
    'contact.form.error': 'Beim Senden Ihrer Nachricht ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    
    // Portfolio Page
    'portfolio.title': 'Portfolio - Phialo Design',
    'portfolio.description': 'Entdecken Sie unsere Kollektion handgefertigter Schmuckstücke.',
    'portfolio.heading': 'Portfolio',
    'portfolio.filter.all': 'Alle',
    'portfolio.filter.rings': 'Ringe',
    'portfolio.filter.necklaces': 'Halsketten',
    'portfolio.filter.earrings': 'Ohrringe',
    'portfolio.filter.bracelets': 'Armbänder',
    'portfolio.viewDetails': 'Details ansehen',
    
    // Services Page
    'services.title': 'Leistungen - Phialo Design',
    'services.description': 'Unsere Schmuck-Dienstleistungen: Von individuellen Anfertigungen bis zur Restaurierung.',
    'services.heading': 'Unsere Leistungen',
    'services.custom': 'Individuelle Anfertigungen',
    'services.custom.desc': 'Lassen Sie Ihre Traumschmuckstücke Wirklichkeit werden mit unseren maßgeschneiderten Designservices.',
    'services.repair': 'Reparatur & Restaurierung',
    'services.repair.desc': 'Professionelle Reparatur und Restaurierung Ihrer wertvollen Schmuckstücke.',
    'services.consultation': 'Beratung',
    'services.consultation.desc': 'Persönliche Beratung für die Auswahl des perfekten Schmuckstücks.',
    
    // Classes Page
    'classes.title': 'Kurse - Phialo Design',
    'classes.description': 'Lernen Sie die Kunst der Schmuckherstellung in unseren Workshops.',
    'classes.heading': 'Schmuck-Workshops',
    'classes.beginner': 'Anfängerkurse',
    'classes.advanced': 'Fortgeschrittenenkurse',
    'classes.private': 'Privatunterricht',
    
    // Footer
    'footer.copyright': '© {year} Phialo Design. Alle Rechte vorbehalten.',
    'footer.social.instagram': 'Folgen Sie uns auf Instagram',
    'footer.social.facebook': 'Besuchen Sie uns auf Facebook',
    'footer.social.pinterest': 'Entdecken Sie uns auf Pinterest',
    
    // Common
    'common.loading': 'Lädt...',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Zurück',
    'common.close': 'Schließen',
    'common.language': 'Sprache',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.portfolio': 'Portfolio',
    'nav.services': 'Services',
    'nav.classes': 'Classes',
    'nav.contact': 'Contact',
    'nav.legal': 'Legal',
    'nav.privacy': 'Privacy',
    'nav.terms': 'Terms',
    'nav.imprint': 'Imprint',
    
    // About Page
    'about.title': 'About - Phialo Design',
    'about.description': 'Discover the story and vision behind Phialo Design - your experts for high-quality, handcrafted jewelry.',
    'about.heading': 'About Phialo',
    'about.intro': 'Welcome to Phialo Design, where every piece of jewelry tells a story. With over 20 years of experience in jewelry making, we combine traditional craftsmanship with contemporary design.',
    'about.philosophy': 'Our philosophy is simple: Every piece should be timeless, elegant, and unique. We believe in the beauty of simplicity and the power of detail.',
    'about.materials': 'We work exclusively with the finest materials - from conflict-free diamonds to ethically sourced gold and silver. Sustainability and quality are at the heart of our creations.',
    'about.team.heading': 'Our Team',
    'about.team.founder': 'Founder & Designer',
    'about.team.cofounder': 'Co-Founder & IT',
    'about.team.founder.bio': 'With a passion for timeless design and sustainable luxury, Gesa Meise leads the creative vision of Phialo Design. She combines years of experience in traditional goldsmithing techniques with modern design approaches.',
    'about.team.cofounder.bio': 'As a technical visionary, Bartholomäus Dedersen brings digital innovation to Phialo Design. His expertise in modern technologies enables us to combine traditional craftsmanship with digital excellence.',
    
    // Contact Page
    'contact.title': 'Contact - Phialo Design',
    'contact.description': 'Get in touch with us for custom jewelry orders or questions about our collections.',
    'contact.heading': 'Contact Me',
    'contact.subtitle': 'We look forward to hearing from you',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.form.name': 'Name',
    'contact.form.email': 'Email',
    'contact.form.message': 'Message',
    'contact.form.submit': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.form.success': 'Thank you for your message! We will get back to you as soon as possible.',
    'contact.form.error': 'An error occurred while sending your message. Please try again.',
    
    // Portfolio Page
    'portfolio.title': 'Portfolio - Phialo Design',
    'portfolio.description': 'Discover our collection of handcrafted jewelry pieces.',
    'portfolio.heading': 'Portfolio',
    'portfolio.filter.all': 'All',
    'portfolio.filter.rings': 'Rings',
    'portfolio.filter.necklaces': 'Necklaces',
    'portfolio.filter.earrings': 'Earrings',
    'portfolio.filter.bracelets': 'Bracelets',
    'portfolio.viewDetails': 'View Details',
    
    // Services Page
    'services.title': 'Services - Phialo Design',
    'services.description': 'Our jewelry services: From custom designs to restoration.',
    'services.heading': 'Our Services',
    'services.custom': 'Custom Designs',
    'services.custom.desc': 'Let your dream jewelry pieces become reality with our custom design services.',
    'services.repair': 'Repair & Restoration',
    'services.repair.desc': 'Professional repair and restoration of your precious jewelry pieces.',
    'services.consultation': 'Consultation',
    'services.consultation.desc': 'Personal consultation for selecting the perfect jewelry piece.',
    
    // Classes Page
    'classes.title': 'Classes - Phialo Design',
    'classes.description': 'Learn the art of jewelry making in our workshops.',
    'classes.heading': 'Jewelry Workshops',
    'classes.beginner': 'Beginner Classes',
    'classes.advanced': 'Advanced Classes',
    'classes.private': 'Private Lessons',
    
    // Footer
    'footer.copyright': '© {year} Phialo Design. All rights reserved.',
    'footer.social.instagram': 'Follow us on Instagram',
    'footer.social.facebook': 'Visit us on Facebook',
    'footer.social.pinterest': 'Discover us on Pinterest',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.language': 'Language',
  },
} as const;

export type UIKeys = keyof typeof ui[typeof defaultLang];

/**
 * Get translations for a specific language
 * @param lang The language code
 * @returns A function that returns translated strings
 */
export function useTranslations(lang: Language = defaultLang) {
  return function t(key: UIKeys): string {
    return ui[lang]?.[key] || ui[defaultLang][key];
  };
}

/**
 * Get a specific translation
 * @param lang The language code
 * @param key The translation key
 * @param replacements Optional replacements for template strings
 */
export function getTranslation(
  lang: Language,
  key: UIKeys,
  replacements?: Record<string, string | number>
): string {
  // Add explicit type annotation to allow string mutations
  let translation: string = ui[lang]?.[key] || ui[defaultLang][key];
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      translation = translation.replace(`{${placeholder}}`, String(value));
    });
  }
  
  return translation;
}