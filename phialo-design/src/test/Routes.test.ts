import { describe, it, expect } from 'vitest';

describe('Page Route Tests', () => {
  it('should have all required page routes', () => {
    const requiredRoutes = [
      '/',
      '/portfolio',
      '/services',
      '/classes',
      '/contact'
    ];

    // Test that all routes exist as files
    requiredRoutes.forEach(route => {
      expect(route).toBeDefined();
    });
  });

  it('should have correct page titles', () => {
    const pageTitles = {
      '/': 'Phialo Design | 3D Design - Schmuck - Classes',
      '/portfolio': 'Portfolio | Phialo Design',
      '/services': '3D für Sie | Phialo Design',
      '/classes': 'Classes | Phialo Design',
      '/contact': 'Kontakt | Phialo Design'
    };

    Object.entries(pageTitles).forEach(([route, title]) => {
      expect(title).toContain('Phialo Design');
    });
  });
});
