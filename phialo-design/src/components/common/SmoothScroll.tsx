import { useEffect } from 'react';

interface SmoothScrollOptions {
  duration?: number;
  easing?: string;
}

export default function SmoothScroll({ 
  duration = 1200, 
  easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
}: SmoothScrollOptions = {}) {
  useEffect(() => {
    // Enable smooth scrolling for the entire document
    document.documentElement.style.scrollBehavior = 'smooth';

    // Enhanced smooth scroll for anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (!target.href) return;
      
      const url = new URL(target.href);
      const hash = url.hash;
      
      if (hash && url.pathname === window.location.pathname) {
        e.preventDefault();
        const element = document.querySelector(hash);
        
        if (element) {
          const headerHeight = 80; // Account for fixed header
          const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    };

    // Add event listeners to all anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    // Parallax effect for hero elements
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('[data-parallax]');
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.getAttribute('data-parallax') || '0.5');
        const transform = `translateY(${scrolled * speed}px)`;
        (element as HTMLElement).style.transform = transform;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Cleanup
      links.forEach(link => {
        link.removeEventListener('click', handleAnchorClick);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [duration, easing]);

  return null; // This component doesn't render anything
}
