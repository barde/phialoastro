import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { TurnstileProvider, useTurnstile } from './TurnstileProvider';

// Mock window.turnstile
const mockTurnstile = {
  render: vi.fn(),
  remove: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
};

// Mock crypto for encryption tests
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
  },
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

describe('TurnstileProvider', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup window mocks
    global.window = {
      turnstile: mockTurnstile,
      crypto: mockCrypto as any,
      onloadTurnstileCallback: undefined,
    } as any;
    
    // Mock document methods
    global.document = {
      createElement: vi.fn((tag: string) => {
        const element = {
          tagName: tag.toUpperCase(),
          style: {},
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          querySelector: vi.fn(),
          querySelectorAll: vi.fn(() => []),
          focus: vi.fn(),
        };
        return element;
      }),
      head: {
        appendChild: vi.fn(),
      },
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      querySelector: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      activeElement: { focus: vi.fn() },
      contains: vi.fn(() => true),
    } as any;

    // Mock performance
    global.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default props', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      expect(result.current.isReady).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.tokens.size).toBe(0);
    });

    it('should handle missing site key gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Turnstile] No site key provided. Turnstile will not be initialized.'
      );
      expect(result.current.error?.code).toBe('MISSING_SITE_KEY');
    });

    it('should load script and become ready', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      expect(result.current.isLoading).toBe(true);
      
      // Simulate script load
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle script loading failure with retry', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" retryAttempts={2} retryDelay={10}>{children}</TurnstileProvider>
      );
      
      // Mock script loading failure
      const scriptElement = {
        onerror: null as any,
        src: '',
        async: true,
        defer: true,
      };
      
      document.createElement = vi.fn(() => scriptElement);
      document.head.appendChild = vi.fn((script) => {
        setTimeout(() => script.onerror?.(), 5);
        return script;
      });
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.error?.code).toBe('SCRIPT_LOAD_FAILED');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Token Management', () => {
    it('should execute challenge and cache token', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        // Simulate successful challenge
        setTimeout(() => options.callback('test-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      let token: string;
      await act(async () => {
        token = await result.current.getToken('test-action');
      });
      
      expect(token!).toBe('test-token');
      expect(result.current.tokens.has('test-action')).toBe(true);
      
      const cachedToken = result.current.tokens.get('test-action');
      expect(cachedToken?.token).toBe('test-token');
      expect(cachedToken?.action).toBe('test-action');
    });

    it('should return cached token once and then remove it (single-use)', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // First call - should execute challenge
      await act(async () => {
        await result.current.getToken('test-action');
      });
      
      expect(mockTurnstile.render).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      let cachedToken: string;
      await act(async () => {
        cachedToken = await result.current.getToken('test-action');
      });
      
      expect(mockTurnstile.render).toHaveBeenCalledTimes(1); // No new render
      expect(cachedToken!).toBe('test-token');
      
      // Token should be removed from cache after use (single-use)
      const tokenData = result.current.tokens.get('test-action');
      expect(tokenData).toBeUndefined();
    });

    it('should always fetch new token for high-security actions', async () => {
      let tokenCount = 0;
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback(`token-${++tokenCount}`), 10);
        return `widget-${tokenCount}`;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider 
          siteKey="test-key"
          securityLevels={{ 'payment': 'interactive' }}
        >{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // First call
      let token1: string;
      await act(async () => {
        token1 = await result.current.getToken('payment');
      });
      
      // Second call - should NOT use cache for high-security
      let token2: string;
      await act(async () => {
        token2 = await result.current.getToken('payment');
      });
      
      expect(token1!).toBe('token-1');
      expect(token2!).toBe('token-2');
      expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
    });

    it('should handle token expiration', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('new-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // Manually add an expired token
      act(() => {
        result.current.tokens.set('test-action', {
          token: 'expired-token',
          timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        });
      });
      
      let newToken: string;
      await act(async () => {
        newToken = await result.current.getToken('test-action');
      });
      
      expect(newToken!).toBe('new-token');
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    it('should clear token and remove widget', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // Add a token
      act(() => {
        result.current.tokens.set('test-action', {
          token: 'test-token',
          timestamp: Date.now(),
        });
      });
      
      expect(result.current.tokens.has('test-action')).toBe(true);
      
      // Clear token
      act(() => {
        result.current.clearToken('test-action');
      });
      
      expect(result.current.tokens.has('test-action')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should set proper ARIA attributes on challenge container', async () => {
      let challengeContainer: any;
      document.createElement = vi.fn((tag: string) => {
        const element = {
          tagName: tag.toUpperCase(),
          style: {},
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          querySelector: vi.fn(),
          querySelectorAll: vi.fn(() => []),
          focus: vi.fn(),
        };
        if (tag === 'div' && !challengeContainer) {
          challengeContainer = element;
        }
        return element;
      });

      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" language="en">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      await act(async () => {
        await result.current.executeChallenge();
      });
      
      expect(challengeContainer.setAttribute).toHaveBeenCalledWith('role', 'dialog');
      expect(challengeContainer.setAttribute).toHaveBeenCalledWith('aria-modal', 'true');
      expect(challengeContainer.setAttribute).toHaveBeenCalledWith('aria-label', 'Security verification');
    });

    it('should handle focus trap with Tab key', async () => {
      const keydownHandler = vi.fn();
      document.addEventListener = vi.fn((event, handler) => {
        if (event === 'keydown') {
          keydownHandler.mockImplementation(handler);
        }
      });

      mockTurnstile.render.mockImplementation((container, options) => {
        // Don't resolve immediately to test key handling
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      act(() => {
        result.current.executeChallenge();
      });
      
      // Simulate Tab key press
      const tabEvent = { key: 'Tab', preventDefault: vi.fn() };
      keydownHandler(tabEvent);
      
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should close challenge on Escape key', async () => {
      const keydownHandler = vi.fn();
      document.addEventListener = vi.fn((event, handler) => {
        if (event === 'keydown') {
          keydownHandler.mockImplementation(handler);
        }
      });

      mockTurnstile.render.mockImplementation(() => 'widget-id');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      const challengePromise = act(() => result.current.executeChallenge());
      
      // Simulate Escape key press
      const escapeEvent = { key: 'Escape', preventDefault: vi.fn() };
      keydownHandler(escapeEvent);
      
      await expect(challengePromise).rejects.toThrow('Challenge cancelled by user');
    });
  });

  describe('Analytics', () => {
    it('should track challenge metrics', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-token'), 50);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" enableAnalytics={true}>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      expect(result.current.analytics.challengesRequested).toBe(0);
      expect(result.current.analytics.challengesCompleted).toBe(0);
      
      await act(async () => {
        await result.current.getToken();
      });
      
      expect(result.current.analytics.challengesRequested).toBe(1);
      expect(result.current.analytics.challengesCompleted).toBe(1);
      expect(result.current.analytics.tokenCacheMisses).toBe(1);
      expect(result.current.analytics.avgChallengeTime).toBeGreaterThan(0);
    });

    it('should track cache hits and misses', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" enableAnalytics={true}>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // First call - cache miss
      await act(async () => {
        await result.current.getToken('test');
      });
      
      expect(result.current.analytics.tokenCacheMisses).toBe(1);
      expect(result.current.analytics.tokenCacheHits).toBe(0);
      
      // Second call - cache hit
      await act(async () => {
        await result.current.getToken('test');
      });
      
      expect(result.current.analytics.tokenCacheMisses).toBe(1);
      expect(result.current.analytics.tokenCacheHits).toBe(1);
    });

    it('should reset analytics', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" enableAnalytics={true}>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      await act(async () => {
        await result.current.getToken();
      });
      
      expect(result.current.analytics.challengesCompleted).toBe(1);
      
      act(() => {
        result.current.resetAnalytics();
      });
      
      expect(result.current.analytics).toEqual({
        challengesRequested: 0,
        challengesCompleted: 0,
        challengesFailed: 0,
        avgChallengeTime: 0,
        tokenCacheHits: 0,
        tokenCacheMisses: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle challenge failure', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options['error-callback'](), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key">{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      await expect(
        act(async () => {
          await result.current.getToken();
        })
      ).rejects.toThrow('Turnstile challenge failed');
    });

    it('should retry challenge on failure', async () => {
      let attemptCount = 0;
      mockTurnstile.render.mockImplementation((container, options) => {
        attemptCount++;
        if (attemptCount < 3) {
          setTimeout(() => options['error-callback'](), 10);
        } else {
          setTimeout(() => options.callback('success-token'), 10);
        }
        return `widget-${attemptCount}`;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider 
          siteKey="test-key" 
          retryAttempts={3} 
          retryDelay={10}
        >{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      let token: string;
      await act(async () => {
        token = await result.current.getToken();
      });
      
      expect(token!).toBe('success-token');
      expect(attemptCount).toBe(3);
    });
  });

  describe('Preloading', () => {
    it('should preload token on initialization', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('preloaded-token'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" enableAnalytics={true}>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      // Wait for preload
      await waitFor(() => {
        expect(result.current.tokens.has('pageload')).toBe(true);
      });
      
      const preloadedToken = result.current.tokens.get('pageload');
      expect(preloadedToken?.token).toBe('preloaded-token');
    });

    it('should manually preload token', async () => {
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('manual-preload'), 10);
        return 'widget-id';
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TurnstileProvider siteKey="test-key" enableAnalytics={false}>{children}</TurnstileProvider>
      );
      
      const { result } = renderHook(() => useTurnstile(), { wrapper });
      
      // Make component ready
      act(() => {
        window.onloadTurnstileCallback?.();
      });
      
      await act(async () => {
        await result.current.preloadToken('custom-action');
      });
      
      expect(result.current.tokens.has('custom-action')).toBe(true);
      expect(result.current.tokens.get('custom-action')?.token).toBe('manual-preload');
    });
  });
});

