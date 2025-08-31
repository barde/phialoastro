import React from 'react';

interface MagneticCursorProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MagneticCursor component - creates a magnetic effect on hover
 * Currently a pass-through component that can be enhanced later
 */
export default function MagneticCursor({ children, className = '' }: MagneticCursorProps) {
  // For now, just pass through the children
  // This can be enhanced later with actual magnetic cursor effect
  return (
    <div className={className}>
      {children}
    </div>
  );
}