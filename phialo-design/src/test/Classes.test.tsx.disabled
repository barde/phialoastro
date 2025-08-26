import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Astro component - simulating the class card with language badge
const ClassCard = ({ title, language }: { title: string; language: string }) => {
  return (
    <article className="class-card">
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

describe('Class Language Badges', () => {
  it('should display DE badge for German classes', () => {
    render(<ClassCard title="Lern Blender" language="de" />);
    const badge = screen.getByText('DE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('de-badge');
  });

  it('should display EN badge for English classes', () => {
    render(<ClassCard title="Learn Blender" language="en" />);
    const badge = screen.getByText('EN');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('en-badge');
  });

  it('should render multiple tutorial cards with correct badges', () => {
    const classes = [
      { title: 'Lern Blender', language: 'de' },
      { title: 'Learn Blender', language: 'en' },
      { title: 'From Sketch To Model', language: 'en' },
    ];

    const { container } = render(
      <div>
        {classes.map((tutorial, index) => (
          <ClassCard key={index} title={tutorial.title} language={tutorial.language} />
        ))}
      </div>
    );

    const deBadges = screen.getAllByText('DE');
    const enBadges = screen.getAllByText('EN');

    expect(deBadges).toHaveLength(1);
    expect(enBadges).toHaveLength(2);
  });
});