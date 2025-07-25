import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  labelEn?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
  isEnglish?: boolean;
}

export default function MobileMenu({ isOpen, onClose, navItems, currentPath, isEnglish = false }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const isActiveLink = (href: string) => {
    const localizedHref = isEnglish ? `/en${href}` : href;
    if (localizedHref === '/' || localizedHref === '/en') {
      return currentPath === localizedHref;
    }
    return currentPath.startsWith(localizedHref);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-midnight/20"
        onClick={onClose}
        data-testid="mobile-menu-backdrop"
      />
      
      {/* Menu Panel */}
      <div 
        className="fixed inset-y-0 right-0 w-full max-w-sm shadow-2xl z-[101] isolate" 
        data-testid="mobile-menu-panel"
        style={{ 
          backgroundColor: '#ffffff',
          opacity: 1,
          backdropFilter: 'none',
          isolation: 'isolate'
        }}
      >
        <div className="flex flex-col h-full" style={{ backgroundColor: '#ffffff' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-theme-border bg-white">
            <h2 className="font-display text-xl font-medium text-theme-text-primary">
              {isEnglish ? 'Menu' : 'Menü'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              aria-label={isEnglish ? 'Close menu' : 'Menü schließen'}
              data-testid="mobile-menu-close"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 bg-white">
            <ul className="space-y-6">
              {navItems.map(({ href, label, labelEn }) => {
                const displayLabel = isEnglish && labelEn ? labelEn : label;
                const localizedHref = isEnglish ? `/en${href}` : href;
                
                return (
                  <li key={href}>
                    <a
                      href={localizedHref}
                      onClick={onClose}
                      className={`block text-lg font-medium transition-colors duration-200 ${
                        isActiveLink(href)
                          ? 'text-theme-accent'
                          : 'text-theme-text-primary hover:text-theme-accent'
                      }`}
                      data-testid={`mobile-nav-${href.replace(/\//g, '') || 'home'}`}
                    >
                      {displayLabel}
                    </a>
                  </li>
                );
              })}
            </ul>
            
          </nav>
          
          {/* CTA */}
          <div className="p-6 border-t border-theme-border bg-white">
            <a
              href={isEnglish ? '/en/contact' : '/contact'}
              onClick={onClose}
              className="block w-full text-center px-6 py-3 text-sm font-medium text-theme-accent border border-theme-accent rounded-full hover:bg-theme-accent hover:text-theme-accent-text transition-all duration-200"
            >
              {isEnglish ? 'Request Project' : 'Projekt anfragen'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
