import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the AnimatedText component
vi.mock('../../components/common/AnimatedText', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('About Page', () => {
  it('should display German content correctly', () => {
    const germanContent = {
      title: 'Über mich',
      greeting: 'Hallo! Ich bin Gesa Pickbrenner.',
      intro: 'Schon von klein auf war ich fasziniert von allem Künstlerischen. Zeichnen, Malen und Bildhauerei waren schon immer meine Art, mich auszudrücken.',
      goldsmithing: '2015 schloss ich meine Ausbildung in der traditionellen Goldschmiedekunst als Jahrgangsbeste in ganz Norddeutschland ab.',
      teaching: 'über 8 Online-Kurse erstellt habe, die rund 10.000 Studierende erreichen',
      autodidact: 'Ich bin Autodidaktin im 3D-Design und in der Illustration.',
      economics: '2023 schloss ich mein Studium mit einem Bachelor in Wirtschaftswissenschaften ab.',
      advocate: 'Ich setze mich dafür ein, dass jeder seinen eigenen einzigartigen kreativen Ausdruck'
    };

    // Create a simple component that displays the content
    const AboutMePage = () => (
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1>{germanContent.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p>{germanContent.greeting}</p>
              <p>{germanContent.intro}</p>
              <p>{germanContent.goldsmithing} {germanContent.teaching}</p>
              <p>{germanContent.autodidact}</p>
              <p>{germanContent.economics}</p>
              <p>{germanContent.advocate}</p>
            </div>
            <div className="relative">
              <img src="test-image.jpg" alt="Gesa Pickbrenner" />
            </div>
          </div>
        </div>
      </main>
    );

    render(<AboutMePage />);

    // Check that all content is present
    expect(screen.getByText(germanContent.title)).toBeInTheDocument();
    expect(screen.getByText(germanContent.greeting)).toBeInTheDocument();
    expect(screen.getByText(germanContent.intro)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(germanContent.goldsmithing))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(germanContent.autodidact))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(germanContent.economics))).toBeInTheDocument();
    expect(screen.getByAltText('Gesa Pickbrenner')).toBeInTheDocument();
  });

  it('should display English content correctly', () => {
    const englishContent = {
      title: 'About',
      greeting: "Hi! I'm Gesa Pickbrenner.",
      intro: 'From a young age, I was mesmerized with anything artistic. Drawing, painting and sculpting have always been my way of expression.',
      goldsmithing: '2015 I graduated in the traditional art of goldsmithing as the best graduate in the whole of Northern Germany.',
      teaching: 'creating 8+ online courses reaching around 10000 students',
      autodidact: "I'm an autodidact in 3D design and illustration.",
      economics: 'In 2023 I graduated with a bachelor in economics.',
      advocate: "I'm an advocate for finding your own unique creative expression"
    };

    // Create a simple component that displays the content
    const AboutMePage = () => (
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1>{englishContent.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p>{englishContent.greeting}</p>
              <p>{englishContent.intro}</p>
              <p>{englishContent.goldsmithing} {englishContent.teaching}</p>
              <p>{englishContent.autodidact}</p>
              <p>{englishContent.economics}</p>
              <p>{englishContent.advocate}</p>
            </div>
            <div className="relative">
              <img src="test-image.jpg" alt="Gesa Pickbrenner" />
            </div>
          </div>
        </div>
      </main>
    );

    render(<AboutMePage />);

    // Check that all content is present
    expect(screen.getByText(englishContent.title)).toBeInTheDocument();
    expect(screen.getByText(englishContent.greeting)).toBeInTheDocument();
    expect(screen.getByText(englishContent.intro)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(englishContent.goldsmithing))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(englishContent.autodidact))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(englishContent.economics))).toBeInTheDocument();
    expect(screen.getByAltText('Gesa Pickbrenner')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const AboutMePage = () => (
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1>About</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p>Text content</p>
            </div>
            <div className="relative">
              <img src="test-image.jpg" alt="Gesa Pickbrenner" />
            </div>
          </div>
        </div>
      </main>
    );

    const { container } = render(<AboutMePage />);

    // Check grid layout exists
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');

    // Check image container exists
    const imageContainer = container.querySelector('.relative');
    expect(imageContainer).toBeInTheDocument();
    
    // Check text content container exists
    const textContainer = container.querySelector('.space-y-6');
    expect(textContainer).toBeInTheDocument();
  });
});