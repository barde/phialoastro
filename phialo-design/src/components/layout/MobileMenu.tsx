import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
}

export default function MobileMenu({ isOpen, onClose, navItems, currentPath }: MobileMenuProps) {
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
    if (href === '/') return currentPath === '/';
    return currentPath.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-midnight/20 dark:bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-midnight shadow-2xl border-l border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-display text-xl font-medium text-midnight dark:text-platinum">Menü</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-midnight dark:text-gray-300 dark:hover:text-platinum transition-colors"
              aria-label="Menü schließen"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-8">
            <ul className="space-y-6">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={onClose}
                    className={`block text-lg font-medium transition-colors duration-200 ${
                      isActiveLink(href)
                        ? 'text-gold'
                        : 'text-midnight hover:text-gold dark:text-platinum dark:hover:text-gold'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* CTA */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-700">
            <a
              href="/contact"
              onClick={onClose}
              className="block w-full text-center px-6 py-3 text-sm font-medium text-gold border border-gold rounded-full hover:bg-gold hover:text-white dark:hover:text-midnight transition-all duration-200"
            >
              Projekt anfragen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
