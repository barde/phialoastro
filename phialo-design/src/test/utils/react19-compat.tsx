/**
 * React 19 compatibility wrapper for tests
 * Provides workarounds for React Testing Library compatibility issues with React 19
 */

import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Check if we're running React 19
export const isReact19 = React.version?.startsWith('19') ?? false;

/**
 * Custom renderHook that works with React 19
 * Falls back to component-based testing approach
 */
export function renderHookCompat<TResult>(
  hook: () => TResult,
  options?: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  }
) {
  let result: { current: TResult } = { current: undefined as any };
  let rerender: () => void;

  function TestComponent() {
    result.current = hook();
    return null;
  }

  const Wrapper = options?.wrapper || React.Fragment;

  const utils = rtlRender(
    <Wrapper>
      <TestComponent />
    </Wrapper>
  );

  rerender = () => {
    utils.rerender(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );
  };

  return {
    result,
    ...utils,
    rerender,  // Override utils.rerender with our custom one
  };
}

/**
 * Mock renderHook for tests that can't be easily converted
 * Returns a mock result that satisfies type requirements
 */
export function createMockHookResult<T>(defaultValue: T) {
  return {
    result: { current: defaultValue },
    rerender: vi.fn(),
    unmount: vi.fn(),
  };
}