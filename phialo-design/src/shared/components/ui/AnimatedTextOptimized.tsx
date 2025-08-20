import React, { useEffect, useRef } from 'react';
import { m, useAnimation, useInView, type Variants } from '../../../lib/framer-motion';
import MotionProvider from '../providers/MotionProvider';

interface AnimatedTextOptimizedProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /**
   * Animation complexity level:
   * - 'simple': Basic fade and slide (default)
   * - 'complex': Full 3D rotation effects
   */
  complexity?: 'simple' | 'complex';
}

/**
 * Optimized AnimatedText component using LazyMotion and 'm' component.
 * Reduces bundle size from ~34kb to ~4.6kb initial + 15kb on demand.
 */
function AnimatedTextContent({ 
  children, 
  className = '', 
  delay = 0,
  complexity = 'simple'
}: AnimatedTextOptimizedProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren: 0.08,
        delayChildren: delay + 0.1,
      }
    }
  };

  // Simplified variants for better performance
  const simpleChildVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      }
    }
  };

  // Complex variants with 3D effects (only if needed)
  const complexChildVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      }
    }
  };

  const childVariants = complexity === 'complex' ? complexChildVariants : simpleChildVariants;

  // Split text into words and characters for animation
  const splitText = (text: string) => {
    return text.split(' ').map((word, wordIndex) => (
      <span key={wordIndex} className="inline-block mr-3">
        {word.split('').map((char, charIndex) => (
          <m.span
            key={charIndex}
            variants={childVariants}
            className="inline-block"
          >
            {char}
          </m.span>
        ))}
      </span>
    ));
  };

  // Simplified text rendering for better compatibility
  const renderContent = () => {
    if (typeof children === 'string') {
      return splitText(children);
    }
    return children;
  };

  return (
    <m.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className={className}
      style={complexity === 'complex' ? { perspective: '1000px' } : undefined}
    >
      {renderContent()}
    </m.div>
  );
}

/**
 * Wrapper component that includes MotionProvider for LazyMotion support
 */
export default function AnimatedTextOptimized(props: AnimatedTextOptimizedProps) {
  return (
    <MotionProvider features="basic">
      <AnimatedTextContent {...props} />
    </MotionProvider>
  );
}