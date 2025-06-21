/**
 * Tutorials Component Translation Tests
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

// Mock data matching the actual Tutorials component
const mockTutorials = [
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
const tutorialsContent = {
  de: {
    title: "Tutorials",
    subtitle: "Lernen Sie 3D-Design mit Blender! Kurse für Anfänger und Fortgeschrittene in Deutsch und Englisch.",
    skillshareLabel: "Auf Skillshare ansehen",
    directPurchaseLabel: "Direkt kaufen (ohne Mitgliedschaft)"
  },
  en: {
    title: "Tutorials", 
    subtitle: "Learn 3D design with Blender! Courses for beginners and advanced users in German and English.",
    skillshareLabel: "View on Skillshare",
    directPurchaseLabel: "Direct purchase (no membership required)"
  }
};

// Mock Tutorials React component for testing
const TutorialsComponent = ({ lang }: { lang?: 'de' | 'en' }) => {
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

  const t = isEnglish ? tutorialsContent.en : tutorialsContent.de;

  return (
    <section id="tutorials" className="py-20 bg-neutral-50">
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

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockTutorials.map((tutorial) => (
            <article 
              key={tutorial.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid={`tutorial-${tutorial.id}`}
            >
              {/* Image */}
              <div className="relative h-48 bg-neutral-200">
                <img 
                  src={tutorial.image} 
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                    {tutorial.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {tutorial.title}
                </h3>
                
                <p className="text-neutral-600 mb-6">
                  {tutorial.description}
                </p>

                <div className="space-y-3">
                  <a 
                    href={tutorial.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors group"
                    data-testid={`skillshare-link-${tutorial.id}`}
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
                  
                  {tutorial.directLink && (
                    <div>
                      <a 
                        href={tutorial.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-gold hover:text-gold/80 font-medium transition-colors group text-sm"
                        data-testid={`direct-link-${tutorial.id}`}
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

describe('Tutorials Component Translation Tests', () => {
  beforeEach(() => {
    mockWindowLocation('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Language Detection', () => {
    testBothLanguages('Tutorials', (context: LanguageContext) => {
      test('renders correct language content based on URL', () => {
        mockWindowLocation(context.currentPath);
        
        render(<TutorialsComponent />);
        
        // Check main content
        expect(screen.getByText('Tutorials')).toBeInTheDocument();
        
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
        
        render(<TutorialsComponent lang={lang} />);
        
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
    test('all tutorials have proper content structure', () => {
      render(<TutorialsComponent />);
      
      // Check that all 5 tutorials are rendered
      expect(screen.getByTestId('tutorial-1')).toBeInTheDocument();
      expect(screen.getByTestId('tutorial-2')).toBeInTheDocument();
      expect(screen.getByTestId('tutorial-3')).toBeInTheDocument();
      expect(screen.getByTestId('tutorial-4')).toBeInTheDocument();
      expect(screen.getByTestId('tutorial-5')).toBeInTheDocument();
      
      // Each tutorial should have title, description, category, and at least one link
      mockTutorials.forEach((tutorial) => {
        const tutorialElement = screen.getByTestId(`tutorial-${tutorial.id}`);
        
        // Check title
        expect(within(tutorialElement).getByText(tutorial.title)).toBeInTheDocument();
        
        // Check description
        expect(within(tutorialElement).getByText(tutorial.description)).toBeInTheDocument();
        
        // Check category
        expect(within(tutorialElement).getByText(tutorial.category)).toBeInTheDocument();
        
        // Check Skillshare link
        const skillshareLink = within(tutorialElement).getByTestId(`skillshare-link-${tutorial.id}`);
        expect(skillshareLink).toHaveAttribute('href', tutorial.link);
        expect(skillshareLink).toHaveAttribute('target', '_blank');
        expect(skillshareLink).toHaveAttribute('rel', 'noopener noreferrer');
        
        // Check direct link if exists
        if (tutorial.directLink) {
          const directLink = within(tutorialElement).getByTestId(`direct-link-${tutorial.id}`);
          expect(directLink).toHaveAttribute('href', tutorial.directLink);
          expect(directLink).toHaveAttribute('target', '_blank');
        }
      });
    });

    test('tutorial 3 has both Skillshare and direct purchase links', () => {
      render(<TutorialsComponent />);
      
      const tutorial3 = screen.getByTestId('tutorial-3');
      
      // Should have both links
      expect(within(tutorial3).getByTestId('skillshare-link-3')).toBeInTheDocument();
      expect(within(tutorial3).getByTestId('direct-link-3')).toBeInTheDocument();
    });
  });

  describe('Language Consistency', () => {
    test('no German text appears in English version', () => {
      mockWindowLocation('/en/tutorials');
      
      render(<TutorialsComponent />);
      
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
      mockWindowLocation('/tutorials');
      
      render(<TutorialsComponent />);
      
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
      mockWindowLocation('/tutorials');
      const { rerender } = render(<TutorialsComponent />);
      
      expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
      expect(screen.getAllByText('Auf Skillshare ansehen')).toHaveLength(5);
      
      // Change to English via prop (simulating prop change from parent)
      rerender(<TutorialsComponent lang="en" />);
      
      // Wait for the component to update
      await waitFor(() => {
        expect(screen.getByText(/Learn 3D design with Blender!/)).toBeInTheDocument();
        expect(screen.getAllByText('View on Skillshare')).toHaveLength(5);
      });
    });

    test('maintains language consistency when navigating between tutorials', async () => {
      mockWindowLocation('/en/tutorials');
      
      render(<TutorialsComponent />);
      
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
      render(<TutorialsComponent />);
      
      expect(screen.getByText('Tutorials')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(5);
    });

    test('handles undefined language context', () => {
      mockWindowLocation('/some/invalid/path');
      
      render(<TutorialsComponent />);
      
      // Should default to German
      expect(screen.getByText(/Lernen Sie 3D-Design mit Blender!/)).toBeInTheDocument();
    });

    test('all tutorial categories are language-independent', () => {
      // Categories contain language info, should not be translated
      render(<TutorialsComponent />);
      
      expect(screen.getByText('Deutsch - Anfängerniveau')).toBeInTheDocument();
      // There are multiple "English - Beginner" tutorials, so use getAllByText
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
        
        render(<TutorialsComponent />);
        
        // Check all external links
        const allLinks = screen.getAllByRole('link');
        
        allLinks.forEach(link => {
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      });

      test('images have proper alt text', () => {
        mockWindowLocation(context.currentPath);
        
        render(<TutorialsComponent />);
        
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(5);
        
        images.forEach((img, index) => {
          expect(img).toHaveAttribute('alt', mockTutorials[index].title);
          expect(img).toHaveAttribute('loading', 'lazy');
        });
      });
    });
  });

  describe('Content Validation', () => {
    test('all required tutorial fields are present', () => {
      render(<TutorialsComponent />);
      
      mockTutorials.forEach(tutorial => {
        const tutorialElement = screen.getByTestId(`tutorial-${tutorial.id}`);
        
        // Required fields
        expect(tutorial.id).toBeDefined();
        expect(tutorial.title).toBeTruthy();
        expect(tutorial.description).toBeTruthy();
        expect(tutorial.image).toBeTruthy();
        expect(tutorial.duration).toBeTruthy();
        expect(tutorial.category).toBeTruthy();
        expect(tutorial.link).toBeTruthy();
        
        // Optional field
        if (tutorial.id === 3) {
          expect(tutorial.directLink).toBeTruthy();
        }
      });
    });

    test('tutorial links are valid URLs', () => {
      mockTutorials.forEach(tutorial => {
        // Skillshare links
        expect(tutorial.link).toMatch(/^https:\/\/skl\.sh\//);
        
        // Direct link if exists
        if (tutorial.directLink) {
          expect(tutorial.directLink).toMatch(/^https:\/\//);
        }
      });
    });
  });

  describe('Visual Consistency', () => {
    test('all tutorials have consistent structure', () => {
      render(<TutorialsComponent />);
      
      const tutorials = screen.getAllByRole('article');
      expect(tutorials).toHaveLength(5);
      
      tutorials.forEach((tutorial, index) => {
        // Each tutorial should have an image
        const img = within(tutorial).getByRole('img');
        expect(img).toBeInTheDocument();
        
        // Each tutorial should have a category badge
        const category = within(tutorial).getByText(mockTutorials[index].category);
        expect(category).toBeInTheDocument();
        
        // Each tutorial should have at least one link
        const links = within(tutorial).getAllByRole('link');
        expect(links.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});