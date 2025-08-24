/**
 * Preact compatibility layer
 * This file helps with the transition from React to Preact
 */

// Re-export everything from @preact/compat
export * from '@preact/compat';
export { default } from '@preact/compat';

// Add any custom compatibility shims here if needed
export const unstable_batchedUpdates = (callback: () => void) => {
  callback();
};

// Ensure Fragment is available
export { Fragment } from '@preact/compat';

// Export hooks explicitly for better compatibility
export {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useErrorBoundary,
  useId
} from '@preact/compat';