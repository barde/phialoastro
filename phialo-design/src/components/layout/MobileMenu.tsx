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
        className="fixed inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div 
        className="fixed inset-y-0 right-0 w-full max-w-sm shadow-2xl border-l"
        style={{ 
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-gray-200)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'var(--color-gray-200)' }}
          >
            <h2 
              className="font-display text-xl font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Menü
            </h2>
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
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
                    className="block text-lg font-medium transition-colors duration-200"
                    style={{
                      color: isActiveLink(href)
                        ? 'var(--color-secondary)'
                        : 'var(--color-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isActiveLink(href)
                        ? 'var(--color-secondary)'
                        : 'var(--color-text-primary)';
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* CTA */}
          <div 
            className="p-6 border-t"
            style={{ borderColor: 'var(--color-gray-200)' }}
          >
            <a
              href="/contact"
              onClick={onClose}
              className="block w-full text-center px-6 py-3 text-sm font-medium rounded-full transition-all duration-200"
              style={{ 
                color: 'var(--color-secondary)',
                border: '1px solid var(--color-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                e.currentTarget.style.color = 'var(--color-text-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-secondary)';
              }}
            >
              Projekt anfragen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
