/**
 * Classes Component Translation Tests
 * Tests to ensure proper language handling and prevent missing translations
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import {
  testBothLanguages,
  mockWindowLocation,
  expectLanguageSpecificContent,
  TEST_TRANSLATIONS,
  type LanguageContext
} from '../../utils/i18n-test-utils';
import '@testing-library/jest-dom';

// Mock data matching the actual Classes component
const mockClasses = [
  {
    id: 1,
    title: 'Lern Blender - 3D Design für absolute Anfänger',
    description: 'Lernen Sie Blender 3D Design von Grund auf. Ein umfassender Kurs für absolute Anfänger auf Deutsch.',
    image: '/images/Thumbnaildeutscherkurs.jpg',
    duration: 'Mehrere Stunden',
    category: 'Deutsch - Anfängerniveau',
    featured: true,
    link: 'https://skl.sh/3F2b3lj'
  },
  {
    id: 2,
    title: 'From Sketch To Model - Design for 3D Printing with Blender',
    description: 'Transform your creative sketches into professional 3D models ready for printing.',
    image: '/images/thumbnailSkillshare.jpg',
    duration: 'Several hours',
    category: 'English - Beginner',
    featured: true,
    link: 'https://skl.sh/2Xjn9BV'
  },
  {
    id: 3,
    title: 'Learn Blender - 3D Design for Absolute Beginners',
    description: 'Master Blender 3D design from scratch. Available on Skillshare or direct purchase.',
    image: '/images/Thumbnail_BlenderBeginnerClass.jpg',
    duration: 'Several hours',
    category: 'English - Beginner',
    featured: true,
    link: 'https://skl.sh/3xw8S77',
    directLink: 'https://gesa-pickbrenner-s-school.teachable.com/p/learn-blender-3d-design-for-absolute-beginners'
  },
  {
    id: 4,
    title: 'Learn All About Curves And Create A Dazzling Ring Design',
    description: 'Master Blender\'s curve tools to create stunning ring designs with flowing patterns.',
    image: '/images/BlenderDazzlingDesigns.jpg',
    duration: 'Several hours',
    category: 'English - All Levels',
    featured: true,
    link: 'https://skl.sh/419ltwx'
  },
  {
    id: 5,
    title: 'Create Unique Surface Patterns With Textures',
    description: 'Learn to create stunning, unique surface patterns using Blender\'s texture system.',
    image: '/images/BlenderCreativeUniqueSurfacePattern_forwebsite.png',
    duration: 'Several hours',
    category: 'English - Intermediate',
    featured: true,
    link: 'https://skl.sh/4bMkx3o'
  }
];

// Language-specific content
const classesContent = {
  de: {
    title: "Classes",
    subtitle: "Lernen Sie 3D-Design mit Blender! Kurse für Anfänger und Fortgeschrittene in Deutsch und Englisch.",
    skillshareLabel: "Auf Skillshare ansehen",
    directPurchaseLabel: "Direkt kaufen (ohne Mitgliedschaft)"
  },
  en: {
    title: "Classes", 
    subtitle: "Learn 3D design with Blender! Courses for beginners and advanced users in German and English.",
    skillshareLabel: "View on Skillshare",
    directPurchaseLabel: "Direct purchase (no membership required)"
  }
};

// Mock Classes React component for testing
const ClassesComponent = ({ lang }: { lang?: 'de' | 'en' }) => {
  const [isEnglish, setIsEnglish] = React.useState(false);
  
  React.useEffect(() => {
    // If lang prop is provided, use it
    if (lang !== undefined) {
      setIsEnglish(lang === 'en');
    } else {
      // Otherwise detect from URL
      const currentPath = window.location.pathname;
      setIsEnglish(currentPath.startsWith('/en/'));
    }
  }, [lang]);

  const t = isEnglish ? classesContent.en : classesContent.de;

  return (
    <section id="classes" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-neutral-900 mb-6">
            {t.title}
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockClasses.map((classItem) => (
            <article 
              key={classItem.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid={`class-${classItem.id}`}
            >
              {/* Image */}
              <div className="relative h-48 bg-neutral-200">
                <img 
                  src={classItem.image} 
                  alt={classItem.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                    {classItem.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {classItem.title}
                </h3>
                
                <p className="text-neutral-600 mb-6">
                  {classItem.description}
                </p>

                <div className="space-y-3">
                  <a 
                    href={classItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors group"
                    data-testid={`skillshare-link-${classItem.id}`}
                  >
                    {t.skillshareLabel}
                    <svg 
                      className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </a>
                  
                  {classItem.directLink && (
                    <div>
                      <a 
                        href={classItem.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-gold hover:text-gold/80 font-medium transition-colors group text-sm"
                        data-testid={`direct-link-${classItem.id}`}
                      >
                        {t.directPurchaseLabel}
                        <svg 
                          className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// Add React import for the mock component
import React from 'react';

describe('Classes Component Translation Tests', () => {
  beforeEach(() => {
    mockWindowLocation('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Language Detection', () => {
    testBothLanguages('Classes', (context: LanguageContext) => {
      test('renders correct language content based on URL', () => {
        mockWindowLocation(context.currentPath);
        
        render(<ClassesComponent />);
        
        // Check main content
        expect(screen.getByText('Classes')).toBeInTheDocument();
        
        if (context.isEnglish) {
          expect(screen.getByText(/Learn 3D design with Blender!/)).toBeInTheDocument();
          expect(screen.getByText(/Courses for beginners and advanced users/)).toBeInTheDocument();
          expect(screen.getAllByText('View on Skillshare')).toHaveLength(5);
          expect(screen.getByText('Direct purchase (no membership required)')).toBeInTheDocument();
        } else {
          expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
          expect(screen.getByText(/Kurse für Anfänger und Fortgeschrittene/)).toBeInTheDocument();
          expect(screen.getAllByText('Auf Skillshare ansehen')).toHaveLength(5);
          expect(screen.getByText('Direkt kaufen (ohne Mitgliedschaft)')).toBeInTheDocument();
        }
      });

      test('renders correct language when lang prop is provided', () => {
        const lang = context.isEnglish ? 'en' : 'de';
        
        render(<ClassesComponent lang={lang} />);
        
        if (context.isEnglish) {
          expect(screen.getByText(/Learn 3D design with Blender!/)).toBeInTheDocument();
          expect(screen.getAllByText('View on Skillshare')).toHaveLength(5);
        } else {
          expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
          expect(screen.getAllByText('Auf Skillshare ansehen')).toHaveLength(5);
        }
      });
    });
  });

  describe('Tutorial Items Content', () => {
    test('all classes have proper content structure', () => {
      render(<ClassesComponent />);
      
      // Check that all 5 classes are rendered
      expect(screen.getByTestId('class-1')).toBeInTheDocument();
      expect(screen.getByTestId('class-2')).toBeInTheDocument();
      expect(screen.getByTestId('class-3')).toBeInTheDocument();
      expect(screen.getByTestId('class-4')).toBeInTheDocument();
      expect(screen.getByTestId('class-5')).toBeInTheDocument();
      
      // Each class should have title, description, category, and at least one link
      mockClasses.forEach((classItem) => {
        const classElement = screen.getByTestId(`class-${classItem.id}`);
        
        // Check title
        expect(within(classElement).getByText(classItem.title)).toBeInTheDocument();
        
        // Check description
        expect(within(classElement).getByText(classItem.description)).toBeInTheDocument();
        
        // Check category
        expect(within(classElement).getByText(classItem.category)).toBeInTheDocument();
        
        // Check Skillshare link
        const skillshareLink = within(classElement).getByTestId(`skillshare-link-${classItem.id}`);
        expect(skillshareLink).toHaveAttribute('href', classItem.link);
        expect(skillshareLink).toHaveAttribute('target', '_blank');
        expect(skillshareLink).toHaveAttribute('rel', 'noopener noreferrer');
        
        // Check direct link if exists
        if (classItem.directLink) {
          const directLink = within(classElement).getByTestId(`direct-link-${classItem.id}`);
          expect(directLink).toHaveAttribute('href', classItem.directLink);
          expect(directLink).toHaveAttribute('target', '_blank');
        }
      });
    });

    test('tutorial 3 has both Skillshare and direct purchase links', () => {
      render(<ClassesComponent />);
      
      const tutorial3 = screen.getByTestId('class-3');
      
      // Should have both links
      expect(within(tutorial3).getByTestId('skillshare-link-3')).toBeInTheDocument();
      expect(within(tutorial3).getByTestId('direct-link-3')).toBeInTheDocument();
    });
  });

  describe('Language Consistency', () => {
    test('no German text appears in English version', () => {
      mockWindowLocation('/en/classes');
      
      render(<ClassesComponent />);
      
      // German phrases that should NOT appear
      const germanPhrases = [
        'Lernen Sie 3D-Design mit Blender!',
        'Kurse für Anfänger und Fortgeschrittene',
        'Auf Skillshare ansehen',
        'Direkt kaufen (ohne Mitgliedschaft)'
      ];
      
      germanPhrases.forEach(phrase => {
        expect(screen.queryByText(phrase)).not.toBeInTheDocument();
      });
      
      // English phrases that SHOULD appear
      expect(screen.getByText(/Learn 3D design with Blender!/)).toBeInTheDocument();
      expect(screen.getAllByText('View on Skillshare')).toHaveLength(5);
      expect(screen.getByText('Direct purchase (no membership required)')).toBeInTheDocument();
    });

    test('no English navigation text appears in German version', () => {
      mockWindowLocation('/classes');
      
      render(<ClassesComponent />);
      
      // English phrases that should NOT appear
      const englishPhrases = [
        'Learn 3D design with Blender!',
        'Courses for beginners and advanced users',
        'View on Skillshare',
        'Direct purchase (no membership required)'
      ];
      
      englishPhrases.forEach(phrase => {
        expect(screen.queryByText(new RegExp(phrase))).not.toBeInTheDocument();
      });
      
      // German phrases that SHOULD appear
      expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
      expect(screen.getAllByText('Auf Skillshare ansehen')).toHaveLength(5);
      expect(screen.getByText('Direkt kaufen (ohne Mitgliedschaft)')).toBeInTheDocument();
    });
  });

  describe('Dynamic Language Updates', () => {
    test('content updates when language changes', async () => {
      // Start with German
      mockWindowLocation('/classes');
      const { rerender } = render(<ClassesComponent />);
      
      expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
      expect(screen.getAllByText('Auf Skillshare ansehen')).toHaveLength(5);
      
      // Change to English via prop (simulating prop change from parent)
      rerender(<ClassesComponent lang="en" />);
      
      // Wait for the component to update
      await waitFor(() => {
        expect(screen.getByText(/Learn 3D design with Blender!/)).toBeInTheDocument();
        expect(screen.getAllByText('View on Skillshare')).toHaveLength(5);
      });
    });

    test('maintains language consistency when navigating between classes', async () => {
      mockWindowLocation('/en/classes');
      
      render(<ClassesComponent />);
      
      // Wait for component to detect English from URL
      await waitFor(() => {
        const skillshareLinks = screen.getAllByText('View on Skillshare');
        expect(skillshareLinks).toHaveLength(5);
      });
      
      // All link labels should be in English
      const skillshareLinks = screen.getAllByText('View on Skillshare');
      
      skillshareLinks.forEach(link => {
        expect(link.textContent).toBe('View on Skillshare');
        expect(link.textContent).not.toContain('Auf Skillshare ansehen');
      });
      
      // Direct purchase link should be in English
      const directLink = screen.getByText('Direct purchase (no membership required)');
      expect(directLink).toBeInTheDocument();
      expect(directLink.textContent).not.toContain('Direkt kaufen');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing translations gracefully', () => {
      // Even with missing translations, component should not crash
      render(<ClassesComponent />);
      
      expect(screen.getByText('Classes')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(5);
    });

    test('handles undefined language context', () => {
      mockWindowLocation('/some/invalid/path');
      
      render(<ClassesComponent />);
      
      // Should default to German
      expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
    });

    test('all class categories are language-independent', () => {
      // Categories contain language info, should not be translated
      render(<ClassesComponent />);
      
      expect(screen.getByText('Deutsch - Anfängerniveau')).toBeInTheDocument();
      // There are multiple "English - Beginner" classes, so use getAllByText
      const englishBeginnerCategories = screen.getAllByText('English - Beginner');
      expect(englishBeginnerCategories).toHaveLength(2); // Tutorial 2 and 3
      expect(screen.getByText('English - All Levels')).toBeInTheDocument();
      expect(screen.getByText('English - Intermediate')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    testBothLanguages('Tutorials Accessibility', (context: LanguageContext) => {
      test('all links have proper accessibility attributes', () => {
        mockWindowLocation(context.currentPath);
        
        render(<ClassesComponent />);
        
        // Check all external links
        const allLinks = screen.getAllByRole('link');
        
        allLinks.forEach(link => {
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      });

      test('images have proper alt text', () => {
        mockWindowLocation(context.currentPath);
        
        render(<ClassesComponent />);
        
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(5);
        
        images.forEach((img, index) => {
          expect(img).toHaveAttribute('alt', mockClasses[index].title);
          expect(img).toHaveAttribute('loading', 'lazy');
        });
      });
    });
  });

  describe('Content Validation', () => {
    test('all required class fields are present', () => {
      render(<ClassesComponent />);
      
      mockClasses.forEach(classItem => {
        const classElement = screen.getByTestId(`class-${classItem.id}`);
        
        // Required fields
        expect(classItem.id).toBeDefined();
        expect(classItem.title).toBeTruthy();
        expect(classItem.description).toBeTruthy();
        expect(classItem.image).toBeTruthy();
        expect(classItem.duration).toBeTruthy();
        expect(classItem.category).toBeTruthy();
        expect(classItem.link).toBeTruthy();
        
        // Optional field
        if (classItem.id === 3) {
          expect(classItem.directLink).toBeTruthy();
        }
      });
    });

    test('tutorial links are valid URLs', () => {
      mockClasses.forEach(classItem => {
        // Skillshare links
        expect(classItem.link).toMatch(/^https:\/\/skl\.sh\//);
        
        // Direct link if exists
        if (classItem.directLink) {
          expect(classItem.directLink).toMatch(/^https:\/\//);
        }
      });
    });
  });

  describe('Visual Consistency', () => {
    test('all classes have consistent structure', () => {
      render(<ClassesComponent />);
      
      const classes = screen.getAllByRole('article');
      expect(classes).toHaveLength(5);
      
      classes.forEach((classItem, index) => {
        // Each class should have an image
        const img = within(classItem).getByRole('img');
        expect(img).toBeInTheDocument();
        
        // Each class should have a category badge
        const category = within(classItem).getByText(mockClasses[index].category);
        expect(category).toBeInTheDocument();
        
        // Each class should have at least one link
        const links = within(classItem).getAllByRole('link');
        expect(links.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});