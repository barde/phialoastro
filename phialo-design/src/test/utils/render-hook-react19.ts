import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';

type RenderHookOptions<Props> = {
  initialProps?: Props;
  wrapper?: React.ComponentType<{children: ReactNode}>;
} & Omit<RenderOptions, 'queries'>;

type RenderHookResult<Result, Props> = {
  result: {
    current: Result;
  };
  rerender: (newProps?: Props) => void;
  unmount: () => void;
};

/**
 * React 19 compatible renderHook implementation that works around the 
 * "Target container is not a DOM element" error by using render() directly.
 */
export function renderHookReact19<Result, Props = undefined>(
  hook: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Result, Props> {
  const { initialProps, wrapper: Wrapper, ...renderOptions } = options || {};
  
  const resultRef = { current: undefined as any } as { current: Result };
  
  // Create a test component that runs the hook and stores the result
  function TestComponent({ hookProps }: { hookProps: Props }) {
    const hookResult = hook(hookProps);
    
    // Store the result immediately (synchronously)
    resultRef.current = hookResult;
    
    return null;
  }
  
  // Create the wrapper component if provided
  function ComponentToRender({ hookProps }: { hookProps: Props }) {
    const TestComp = () => React.createElement(TestComponent, { hookProps });
    
    return Wrapper ? (
      React.createElement(Wrapper, { children: TestComp() })
    ) : (
      TestComp()
    );
  }
  
  // Ensure document.body exists for React 19 compatibility
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }
  
  // Create a container explicitly for React 19 compatibility
  const container = document.createElement('div');
  container.setAttribute('id', 'test-root');
  document.body.appendChild(container);
  
  // Use React Testing Library's render function with explicit container
  const { rerender: rerenderComponent, unmount: originalUnmount } = render(
    React.createElement(ComponentToRender, { hookProps: initialProps as Props }), 
    { ...renderOptions, container, baseElement: container }
  );
  
  // Wrap unmount to also clean up the container
  const unmount = () => {
    originalUnmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
  
  const rerender = (newProps?: Props) => {
    const propsToUse = newProps !== undefined ? newProps : initialProps;
    rerenderComponent(React.createElement(ComponentToRender, { hookProps: propsToUse as Props }));
  };
  
  return {
    result: resultRef,
    rerender,
    unmount,
  };
}

// For backward compatibility
export { renderHookReact19 as renderHook };