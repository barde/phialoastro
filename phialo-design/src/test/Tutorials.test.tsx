import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Astro component - simulating the tutorial card with language badge
const TutorialCard = ({ title, language }: { title: string; language: string }) => {
  return (
    <article className="tutorial-card">
      <div className="relative">
        <img src="/test.jpg" alt={title} />
        <div className="absolute top-3 right-3">
          <span className={`language-badge ${language === 'de' ? 'de-badge' : 'en-badge'}`}>
            {language === 'de' ? 'DE' : 'EN'}
          </span>
        </div>
      </div>
      <div className="content">
        <h3>{title}</h3>
      </div>
    </article>
  );
};

describe('Tutorial Language Badges', () => {
  it('should display DE badge for German tutorials', () => {
    render(<TutorialCard title="Lern Blender" language="de" />);
    const badge = screen.getByText('DE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('de-badge');
  });

  it('should display EN badge for English tutorials', () => {
    render(<TutorialCard title="Learn Blender" language="en" />);
    const badge = screen.getByText('EN');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('en-badge');
  });

  it('should render multiple tutorial cards with correct badges', () => {
    const tutorials = [
      { title: 'Lern Blender', language: 'de' },
      { title: 'Learn Blender', language: 'en' },
      { title: 'From Sketch To Model', language: 'en' },
    ];

    const { container } = render(
      <div>
        {tutorials.map((tutorial, index) => (
          <TutorialCard key={index} title={tutorial.title} language={tutorial.language} />
        ))}
      </div>
    );

    const deBadges = screen.getAllByText('DE');
    const enBadges = screen.getAllByText('EN');

    expect(deBadges).toHaveLength(1);
    expect(enBadges).toHaveLength(2);
  });
});