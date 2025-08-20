// Centralized Framer Motion imports with LazyMotion optimization
// Using 'm' component and LazyMotion reduces bundle from ~34kb to ~4.6kb initial

// Core lightweight components (4.6kb initial bundle)
export { 
  m,              // Lightweight motion component (replaces 'motion')
  LazyMotion,     // Feature loader wrapper
  AnimatePresence // For exit animations
} from 'framer-motion';

// Feature set imports - loaded on demand
export { domAnimation } from 'framer-motion'; // Basic animations (15kb)
// export { domMax } from 'framer-motion'; // Full features (25kb) - only if needed

// Hooks and types (minimal overhead)
export { 
  useInView,
  useAnimation,
  type Variants 
} from 'framer-motion';

// Legacy motion export for backward compatibility
// TODO: Migrate all components to use 'm' instead
export { motion } from 'framer-motion';