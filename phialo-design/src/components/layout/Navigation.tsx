import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/services', label: '3D für Sie' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/contact', label: 'Kontakt' }
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    
    // Update current path on navigation
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
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
        {navItems.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className={`relative text-sm font-medium transition-colors duration-200 group ${
              isActiveLink(href)
                ? 'text-midnight dark:text-platinum'
                : 'text-gray-600 hover:text-midnight dark:text-gray-300 dark:hover:text-platinum'
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
        
        {/* Theme Toggle for Desktop */}
        <ThemeToggle />
      </nav>

      {/* Mobile Menu Button and Theme Toggle */}
      <div className="lg:hidden flex items-center space-x-2">
        <ThemeToggle />
        <button
          className="p-2 text-midnight hover:text-gold dark:text-platinum dark:hover:text-gold transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

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
