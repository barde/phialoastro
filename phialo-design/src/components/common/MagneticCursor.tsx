import { useEffect, useRef } from 'react';

interface MagneticCursorProps {
  children: React.ReactNode;
}

export default function MagneticCursor({ children }: MagneticCursorProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Calculate magnetic force (stronger when closer)
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 100; // Magnetic field radius
      
      if (distance < maxDistance) {
        const force = Math.max(0, 1 - distance / maxDistance);
        const magnetX = x * force * 0.3;
        const magnetY = y * force * 0.3;

        element.style.transform = `translate(${magnetX}px, ${magnetY}px)`;
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className="transition-transform duration-300 ease-out"
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
