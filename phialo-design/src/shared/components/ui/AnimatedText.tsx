import React, { useEffect, useRef } from 'react';
import { m, LazyMotion, domAnimation, useAnimation, useInView, type Variants } from '../../../lib/framer-motion';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Optimized AnimatedText component using LazyMotion and 'm' component.
 * Reduces bundle size from ~34kb to ~4.6kb initial + 15kb on demand.
 */
export default function AnimatedText({ children, className = '', delay = 0 }: AnimatedTextProps) {
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

  // Simplified variants for better performance (removed rotateX for smaller bundle)
  const childVariants: Variants = {
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
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className={className}
      >
        {renderContent()}
      </m.div>
    </LazyMotion>
  );
}
