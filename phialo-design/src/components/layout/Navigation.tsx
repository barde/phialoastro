import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from './LanguageSwitcher';
import { getLocaleFromUrl, type Locale } from '../../lib/i18n';

const getNavItems = (locale: Locale) => {
  const baseItems = [
    { href: '/portfolio', label: locale === 'de' ? 'Portfolio' : 'Portfolio' },
    { href: '/services', label: locale === 'de' ? '3D für Sie' : '3D for You' },
    { href: '/tutorials', label: locale === 'de' ? 'Tutorials' : 'Tutorials' },
    { href: '/contact', label: locale === 'de' ? 'Kontakt' : 'Contact' }
  ];

  // Add locale prefix for non-default locale
  return baseItems.map(item => ({
    ...item,
    href: locale === 'en' ? item.href : `/de${item.href}`
  }));
};

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  useEffect(() => {
    const url = new URL(window.location.href);
    const locale = getLocaleFromUrl(url);
    setCurrentLocale(locale);
    setCurrentPath(window.location.pathname);
    
    // Update current path and locale on navigation
    const handleLocationChange = () => {
      const newUrl = new URL(window.location.href);
      const newLocale = getLocaleFromUrl(newUrl);
      setCurrentLocale(newLocale);
      setCurrentPath(window.location.pathname);
    };
    
    // Listen for Astro page transitions
    document.addEventListener('astro:page-load', handleLocationChange);
    
    return () => {
      document.removeEventListener('astro:page-load', handleLocationChange);
    };
  }, []);

  const navItems = getNavItems(currentLocale);

  const isActiveLink = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-8">
        {navItems.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className={`relative text-sm font-medium transition-colors duration-200 group ${
              isActiveLink(href)
                ? 'text-midnight'
                : 'text-gray-600 hover:text-midnight'
            }`}
          >
            {label}
            <span 
              className={`absolute left-0 -bottom-1 h-0.5 bg-gold transition-all duration-200 ${
                isActiveLink(href) 
                  ? 'w-full' 
                  : 'w-0 group-hover:w-full'
              }`}
            />
          </a>
        ))}
        
        {/* Language Switcher */}
        <LanguageSwitcher />
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 text-midnight hover:text-gold transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        currentPath={currentPath}
      />
    </>
  );
}
