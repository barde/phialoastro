/**
 * Framer Motion has been removed from this project to reduce bundle size.
 * All components have been migrated to CSS-only animations.
 * 
 * This file exists only for backward compatibility during the migration.
 * It will be removed once all imports are updated.
 */

// Export empty placeholders to prevent build errors
export const m = () => null;
export const motion = () => null;
export const LazyMotion = ({ children }: any) => children;
export const AnimatePresence = ({ children }: any) => children;
export const domAnimation = {};
export const useInView = () => true;
export const useAnimation = () => ({});
export type Variants = Record<string, any>;