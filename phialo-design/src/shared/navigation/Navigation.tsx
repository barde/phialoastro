import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';

interface NavigationProps {}

const navItems = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/services', label: '3D für Sie', labelEn: '3D for You' },
  { href: '/classes', label: 'Classes' },
  { href: '/about', label: 'Über mich', labelEn: 'About' },
  { href: '/contact', label: 'Kontakt', labelEn: 'Contact' }
];

export default function Navigation({}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setIsEnglish(window.location.pathname.startsWith('/en/'));
    
    // Update current path on navigation
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setIsEnglish(window.location.pathname.startsWith('/en/'));
    };
    
    // Listen for Astro page transitions
    document.addEventListener('astro:page-load', handleLocationChange);
    
    return () => {
      document.removeEventListener('astro:page-load', handleLocationChange);
    };
  }, []);

  const isActiveLink = (href: string) => {
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-8">
        {navItems.map(({ href, label, labelEn }) => {
          const displayLabel = isEnglish && labelEn ? labelEn : label;
          const localizedHref = isEnglish ? `/en${href}` : href;
          
          return (
            <a
              key={href}
              href={localizedHref}
              className={`relative text-sm font-medium transition-colors duration-200 group ${
                isActiveLink(localizedHref)
                  ? 'text-midnight'
                  : 'text-gray-600 hover:text-midnight'
              }`}
            >
              {displayLabel}
              <span 
                className={`absolute left-0 -bottom-1 h-0.5 bg-gold transition-all duration-200 ${
                  isActiveLink(localizedHref) 
                    ? 'w-full' 
                  : 'w-0 group-hover:w-full'
              }`}
            />
            </a>
          );
        })}
        
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 text-midnight hover:text-gold transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen 
          ? (isEnglish ? 'Close menu' : 'Menü schließen')
          : (isEnglish ? 'Open menu' : 'Menü öffnen')
        }
        data-testid="mobile-menu-button"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        currentPath={currentPath}
        isEnglish={isEnglish}
      />
    </>
  );
}
