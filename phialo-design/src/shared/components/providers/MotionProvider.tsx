import React from 'react';
import { LazyMotion, domAnimation } from '../../../lib/framer-motion';

interface MotionProviderProps {
  children: React.ReactNode;
  /**
   * Feature set to load:
   * - 'basic': domAnimation (15kb) - Default, covers most use cases
   * - 'async': Load features asynchronously for better performance
   */
  features?: 'basic' | 'async';
}

// Async feature loading for maximum optimization
const loadFeatures = () =>
  import('framer-motion').then(res => res.domAnimation);

/**
 * MotionProvider wraps components that use Framer Motion animations.
 * This enables LazyMotion which significantly reduces bundle size.
 * 
 * Usage:
 * ```tsx
 * <MotionProvider>
 *   <AnimatedComponent />
 * </MotionProvider>
 * ```
 */
export const MotionProvider: React.FC<MotionProviderProps> = ({ 
  children, 
  features = 'basic' 
}) => {
  // Use synchronous loading for better initial render
  // Switch to async only if specifically requested
  const motionFeatures = features === 'async' ? loadFeatures : domAnimation;

  return (
    <LazyMotion features={motionFeatures} strict>
      {children}
    </LazyMotion>
  );
};

export default MotionProvider;