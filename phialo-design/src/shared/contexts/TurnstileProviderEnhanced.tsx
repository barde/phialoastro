import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TurnstileOptions } from '../types/turnstile';

// Enhanced token interface with rotation support
interface TurnstileToken {
  token: string;
  timestamp: number;
  action?: string;
  uses: number;
  maxUses: number;
  encrypted?: boolean;
}

// Enhanced error types for better error handling
interface TurnstileError {
  type: 'script' | 'challenge' | 'network' | 'validation';
  message: string;
  code?: string;
  retryable?: boolean;
}

// Analytics data structure
interface TurnstileAnalytics {
  challengesRequested: number;
  challengesCompleted: number;
  challengesFailed: number;
  avgChallengeTime: number;
  tokenCacheHits: number;
  tokenCacheMisses: number;
}

interface TurnstileContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: TurnstileError | null;
  tokens: Map<string, TurnstileToken>;
  analytics: TurnstileAnalytics;
  getToken: (action?: string) => Promise<string>;
  clearToken: (action?: string) => void;
  executeChallenge: (action?: string) => Promise<string>;
  resetAnalytics: () => void;
  preloadToken: (action?: string) => void;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

interface TurnstileProviderProps {
  children: React.ReactNode;
  siteKey?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  language?: 'auto' | 'de' | 'en';
  defaultAction?: string;
  securityLevels?: Record<string, 'interactive' | 'managed' | 'non-interactive'>;
  maxCacheSize?: number;
  enableAnalytics?: boolean;
  enableEncryption?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  debugMode?: boolean;
}

// LRU Cache implementation
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Delete and re-add to move to end
    this.cache.delete(key);
    this.cache.set(key, value);

    // Remove oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}

// Utility for exponential backoff
const exponentialBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    if (onRetry) {
      onRetry(retries, error);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return exponentialBackoff(fn, retries - 1, delay * 2, onRetry);
  }
};

// Simple encryption utilities using Web Crypto API
const encryptToken = async (token: string): Promise<string> => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return token; // Fallback to unencrypted in unsupported environments
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    
    // Generate a random key for this session
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Store key and IV with encrypted data (simplified for demo)
    // In production, you'd want a more sophisticated key management strategy
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch {
    return token; // Fallback to unencrypted on error
  }
};

export const TurnstileProvider: React.FC<TurnstileProviderProps> = ({
  children,
  siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY,
  appearance = 'execute',
  language = 'auto',
  defaultAction = 'default',
  securityLevels = {
    'contact-form': 'managed',
    'account-signup': 'managed',
    'account-login': 'managed',
    'password-reset': 'interactive',
    'payment-form': 'interactive',
    'newsletter': 'non-interactive',
    'default': 'managed'
  },
  maxCacheSize = 10,
  enableAnalytics = true,
  enableEncryption = false,
  retryAttempts = 3,
  retryDelay = 1000,
  debugMode = false,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TurnstileError | null>(null);
  const [tokensCache] = useState(() => new LRUCache<string, TurnstileToken>(maxCacheSize));
  const [tokens, setTokens] = useState<Map<string, TurnstileToken>>(new Map());
  const [analytics, setAnalytics] = useState<TurnstileAnalytics>({
    challengesRequested: 0,
    challengesCompleted: 0,
    challengesFailed: 0,
    avgChallengeTime: 0,
    tokenCacheHits: 0,
    tokenCacheMisses: 0,
  });
  
  const widgetRefs = useRef<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const focusRestoreRef = useRef<HTMLElement | null>(null);
  const challengeStartTime = useRef<number>(0);

  // Token expiry time (5 minutes)
  const TOKEN_EXPIRY = 5 * 60 * 1000;

  // Debug logging
  const debug = useCallback((...args: any[]) => {
    if (debugMode) {
      console.log('[Turnstile]', ...args);
    }
  }, [debugMode]);

  // Update analytics
  const updateAnalytics = useCallback((update: Partial<TurnstileAnalytics>) => {
    if (!enableAnalytics) return;
    
    setAnalytics(prev => {
      const newAnalytics = { ...prev, ...update };
      
      // Calculate average challenge time
      if (update.challengesCompleted) {
        const totalTime = prev.avgChallengeTime * prev.challengesCompleted;
        const newTotalTime = totalTime + (Date.now() - challengeStartTime.current);
        newAnalytics.avgChallengeTime = newTotalTime / newAnalytics.challengesCompleted;
      }
      
      return newAnalytics;
    });
  }, [enableAnalytics]);

  // Configuration validation
  useEffect(() => {
    if (!siteKey && typeof window !== 'undefined') {
      console.warn('[Turnstile] No site key provided. Turnstile will not be initialized.');
      setError({
        type: 'validation',
        message: 'No Turnstile site key configured',
        code: 'MISSING_SITE_KEY',
        retryable: false,
      });
    }
  }, [siteKey]);

  // Load Turnstile script globally with enhanced error handling
  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;

    const loadScript = async () => {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (existingScript) {
        // Script already exists, check if Turnstile is ready
        if (window.turnstile) {
          setIsReady(true);
          debug('Turnstile already loaded');
        } else {
          // Wait for the existing script to load
          window.onloadTurnstileCallback = () => {
            setIsReady(true);
            debug('Turnstile loaded from existing script');
          };
        }
        return;
      }

      // Load the script with retry logic
      setIsLoading(true);
      
      try {
        await exponentialBackoff(
          async () => {
            return new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback';
              script.async = true;
              script.defer = true;

              window.onloadTurnstileCallback = () => {
                setIsReady(true);
                setIsLoading(false);
                debug('Turnstile script loaded successfully');
                resolve();
              };

              script.onerror = () => {
                reject(new Error('Failed to load Turnstile script'));
              };

              document.head.appendChild(script);
            });
          },
          retryAttempts,
          retryDelay,
          (attempt, error) => {
            debug(`Retrying script load, attempts remaining: ${attempt}`, error);
          }
        );
      } catch (error) {
        setError({
          type: 'script',
          message: 'Failed to load Turnstile script after multiple attempts',
          code: 'SCRIPT_LOAD_FAILED',
          retryable: true,
        });
        setIsLoading(false);
      }
    };

    loadScript();

    return () => {
      // Cleanup widget refs on unmount
      widgetRefs.current.forEach((widgetId) => {
        if (window.turnstile) {
          window.turnstile.remove(widgetId);
        }
      });
      widgetRefs.current.clear();
    };
  }, [siteKey, retryAttempts, retryDelay, debug]);

  // Preload a token for better UX
  const preloadToken = useCallback(async (action: string = 'pageload') => {
    if (!isReady) return;
    
    try {
      debug(`Preloading token for action: ${action}`);
      await getToken(action);
    } catch (error) {
      debug('Failed to preload token', error);
    }
  }, [isReady]);

  // Pre-warm the cache when ready
  useEffect(() => {
    if (isReady && enableAnalytics) {
      preloadToken();
    }
  }, [isReady, enableAnalytics, preloadToken]);

  // Check if a token is still valid
  const isTokenValid = (token: TurnstileToken): boolean => {
    const isExpired = Date.now() - token.timestamp > TOKEN_EXPIRY;
    const isOverused = token.uses >= token.maxUses;
    
    return !isExpired && !isOverused;
  };

  // Get maximum uses for an action
  const getMaxUsesForAction = (action: string): number => {
    const level = securityLevels[action] || securityLevels['default'] || 'managed';
    
    switch (level) {
      case 'interactive':
        return 1; // Single use for high-security actions
      case 'non-interactive':
        return 10; // Multiple uses for low-security actions
      case 'managed':
      default:
        return 5; // Moderate use for balanced security
    }
  };

  // Get or create a token for a specific action
  const getToken = useCallback(async (action: string = 'default'): Promise<string> => {
    const isHighSecurity = securityLevels[action] === 'interactive';
    
    // Always fetch new token for high-security actions
    if (isHighSecurity) {
      debug(`High-security action "${action}", fetching new token`);
      updateAnalytics({ tokenCacheMisses: analytics.tokenCacheMisses + 1 });
      return executeChallenge(action);
    }

    // Check if we have a valid cached token
    const cachedToken = tokensCache.get(action);
    if (cachedToken && isTokenValid(cachedToken)) {
      debug(`Using cached token for action "${action}"`);
      
      // Increment usage
      cachedToken.uses++;
      tokensCache.set(action, cachedToken);
      setTokens(new Map(tokensCache.entries()));
      
      updateAnalytics({ tokenCacheHits: analytics.tokenCacheHits + 1 });
      return cachedToken.token;
    }

    // Execute challenge to get a new token
    debug(`No valid cached token for action "${action}", executing challenge`);
    updateAnalytics({ tokenCacheMisses: analytics.tokenCacheMisses + 1 });
    return executeChallenge(action);
  }, [tokensCache, securityLevels, analytics, updateAnalytics, debug]);

  // Get the appropriate appearance mode based on security level
  const getAppearanceForAction = useCallback((action: string): 'always' | 'execute' | 'interaction-only' => {
    const level = securityLevels[action] || securityLevels['default'] || 'managed';
    
    switch (level) {
      case 'interactive':
        return 'always'; // Always show interactive challenge
      case 'non-interactive':
        return 'interaction-only'; // Never show interactive challenge
      case 'managed':
      default:
        return 'execute'; // Let Cloudflare decide
    }
  }, [securityLevels]);

  // Execute a challenge to get a new token with enhanced error handling and accessibility
  const executeChallenge = useCallback(async (action: string = 'default'): Promise<string> => {
    if (!isReady || !window.turnstile || !siteKey) {
      throw new Error('Turnstile is not ready');
    }

    updateAnalytics({ challengesRequested: analytics.challengesRequested + 1 });
    challengeStartTime.current = Date.now();

    return exponentialBackoff(
      async () => {
        return new Promise<string>((resolve, reject) => {
          // Store currently focused element for restoration
          focusRestoreRef.current = document.activeElement as HTMLElement;

          // Create accessible container for challenge
          const challengeContainer = document.createElement('div');
          challengeContainer.setAttribute('role', 'dialog');
          challengeContainer.setAttribute('aria-modal', 'true');
          challengeContainer.setAttribute('aria-label', language === 'de' ? 'Sicherheitsüberprüfung' : 'Security verification');
          challengeContainer.style.position = 'fixed';
          challengeContainer.style.top = '50%';
          challengeContainer.style.left = '50%';
          challengeContainer.style.transform = 'translate(-50%, -50%)';
          challengeContainer.style.zIndex = '9999';
          
          // Add backdrop with proper semantics
          const backdrop = document.createElement('div');
          backdrop.setAttribute('aria-hidden', 'true');
          backdrop.style.position = 'fixed';
          backdrop.style.top = '0';
          backdrop.style.left = '0';
          backdrop.style.width = '100%';
          backdrop.style.height = '100%';
          backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          backdrop.style.zIndex = '9998';

          // Add focus trap
          const focusTrap = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
              const focusableElements = challengeContainer.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              const firstFocusable = focusableElements[0] as HTMLElement;
              const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

              if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
              } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
              }
            } else if (e.key === 'Escape') {
              cleanup();
              reject(new Error('Challenge cancelled by user'));
            }
          };

          document.addEventListener('keydown', focusTrap);

          const cleanup = () => {
            document.removeEventListener('keydown', focusTrap);
            document.body.removeChild(challengeContainer);
            document.body.removeChild(backdrop);
            
            // Restore focus
            if (focusRestoreRef.current && document.contains(focusRestoreRef.current)) {
              focusRestoreRef.current.focus();
            }
            
            if (widgetId) {
              window.turnstile?.remove(widgetId);
              widgetRefs.current.delete(action);
            }
          };

          document.body.appendChild(backdrop);
          document.body.appendChild(challengeContainer);

          // Get appropriate appearance for this action
          const actionAppearance = getAppearanceForAction(action);

          const options: TurnstileOptions = {
            sitekey: siteKey,
            action,
            appearance: actionAppearance,
            language,
            theme: 'auto',
            callback: async (token: string) => {
              try {
                // Optionally encrypt token
                const finalToken = enableEncryption ? await encryptToken(token) : token;
                
                // Store the token
                const newToken: TurnstileToken = {
                  token: finalToken,
                  timestamp: Date.now(),
                  action,
                  uses: 0,
                  maxUses: getMaxUsesForAction(action),
                  encrypted: enableEncryption,
                };
                
                tokensCache.set(action, newToken);
                setTokens(new Map(tokensCache.entries()));
                
                updateAnalytics({
                  challengesCompleted: analytics.challengesCompleted + 1,
                });

                cleanup();
                resolve(finalToken);
              } catch (error) {
                cleanup();
                reject(error);
              }
            },
            'error-callback': () => {
              updateAnalytics({ challengesFailed: analytics.challengesFailed + 1 });
              cleanup();
              reject(new Error('Turnstile challenge failed'));
            },
            'expired-callback': () => {
              // Remove expired token
              tokensCache.delete(action);
              setTokens(new Map(tokensCache.entries()));
            },
            'timeout-callback': () => {
              updateAnalytics({ challengesFailed: analytics.challengesFailed + 1 });
              cleanup();
              reject(new Error('Turnstile challenge timed out'));
            },
          };

          let widgetId: string;
          try {
            widgetId = window.turnstile.render(challengeContainer, options);
            widgetRefs.current.set(action, widgetId);
            
            // Focus the challenge iframe for accessibility
            setTimeout(() => {
              const iframe = challengeContainer.querySelector('iframe');
              if (iframe) {
                iframe.focus();
              }
            }, 100);
          } catch (error) {
            cleanup();
            reject(error);
          }
        });
      },
      retryAttempts,
      retryDelay,
      (attempt, error) => {
        debug(`Retrying challenge execution, attempts remaining: ${attempt}`, error);
        setError({
          type: 'challenge',
          message: `Challenge failed, retrying... (${attempt} attempts left)`,
          code: 'CHALLENGE_RETRY',
          retryable: true,
        });
      }
    );
  }, [
    isReady,
    siteKey,
    language,
    getAppearanceForAction,
    analytics,
    updateAnalytics,
    enableEncryption,
    retryAttempts,
    retryDelay,
    debug,
    tokensCache,
  ]);

  // Clear a specific token
  const clearToken = useCallback((action: string = 'default') => {
    tokensCache.delete(action);
    setTokens(new Map(tokensCache.entries()));

    // Remove widget if it exists
    const widgetId = widgetRefs.current.get(action);
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId);
      widgetRefs.current.delete(action);
    }
    
    debug(`Cleared token for action: ${action}`);
  }, [tokensCache, debug]);

  // Reset analytics
  const resetAnalytics = useCallback(() => {
    setAnalytics({
      challengesRequested: 0,
      challengesCompleted: 0,
      challengesFailed: 0,
      avgChallengeTime: 0,
      tokenCacheHits: 0,
      tokenCacheMisses: 0,
    });
  }, []);

  const contextValue: TurnstileContextValue = {
    isReady,
    isLoading,
    error,
    tokens,
    analytics,
    getToken,
    clearToken,
    executeChallenge,
    resetAnalytics,
    preloadToken,
  };

  return (
    <TurnstileContext.Provider value={contextValue}>
      {children}
      {/* Hidden container for pre-clearance if needed */}
      <div ref={containerRef} style={{ display: 'none' }} aria-hidden="true" />
      
      {/* Debug panel */}
      {debugMode && (
        <div
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            fontSize: '12px',
            borderRadius: '5px',
            zIndex: 10000,
            maxWidth: '300px',
          }}
        >
          <h4 style={{ margin: '0 0 5px 0' }}>Turnstile Debug</h4>
          <div>Ready: {isReady ? '✅' : '❌'}</div>
          <div>Loading: {isLoading ? '⏳' : '✅'}</div>
          <div>Tokens cached: {tokens.size}</div>
          {enableAnalytics && (
            <>
              <div>Cache hits: {analytics.tokenCacheHits}</div>
              <div>Cache misses: {analytics.tokenCacheMisses}</div>
              <div>Challenges: {analytics.challengesCompleted}/{analytics.challengesRequested}</div>
              <div>Avg time: {Math.round(analytics.avgChallengeTime)}ms</div>
            </>
          )}
          {error && <div style={{ color: '#ff6b6b' }}>Error: {error.message}</div>}
        </div>
      )}
    </TurnstileContext.Provider>
  );
};

export const useTurnstile = () => {
  const context = React.useContext(TurnstileContext);
  if (!context) {
    throw new Error('useTurnstile must be used within a TurnstileProvider');
  }
  return context;
};

// Export for testing
export { TurnstileContext, LRUCache, exponentialBackoff, encryptToken };

export default TurnstileProvider;