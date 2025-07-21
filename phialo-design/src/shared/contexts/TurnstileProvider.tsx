import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TurnstileOptions } from '../types/turnstile';

interface TurnstileToken {
  token: string;
  timestamp: number;
  action?: string;
  uses?: number;
  maxUses?: number;
}

interface TurnstileContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: Map<string, TurnstileToken>;
  getToken: (action?: string) => Promise<string>;
  clearToken: (action?: string) => void;
  executeChallenge: (action?: string) => Promise<string>;
  preloadToken?: (action?: string) => Promise<void>;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

interface TurnstileProviderProps {
  children: React.ReactNode;
  siteKey?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  language?: 'auto' | 'de' | 'en';
  defaultAction?: string;
  securityLevels?: Record<string, 'interactive' | 'managed' | 'non-interactive'>;
}

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
  }
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Map<string, TurnstileToken>>(new Map());
  const widgetRefs = useRef<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Token expiry time (5 minutes)
  const TOKEN_EXPIRY = 5 * 60 * 1000;

  // Load Turnstile script globally
  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      // Script already exists, check if Turnstile is ready
      if (window.turnstile) {
        setIsReady(true);
      } else {
        // Wait for the existing script to load
        window.onloadTurnstileCallback = () => {
          setIsReady(true);
        };
      }
      return;
    }

    // Load the script
    setIsLoading(true);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
    script.async = true;
    script.defer = true;

    window.onloadTurnstileCallback = () => {
      setIsReady(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Failed to load Turnstile script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup widget refs on unmount
      widgetRefs.current.forEach((widgetId) => {
        if (window.turnstile) {
          window.turnstile.remove(widgetId);
        }
      });
      widgetRefs.current.clear();
    };
  }, [siteKey]);

  // Check if a token is still valid
  const isTokenValid = (token: TurnstileToken): boolean => {
    const isExpired = Date.now() - token.timestamp > TOKEN_EXPIRY;
    const isOverused = token.uses !== undefined && token.maxUses !== undefined 
      ? token.uses >= token.maxUses 
      : false;
    return !isExpired && !isOverused;
  };

  // Get maximum uses for an action based on security level
  const getMaxUsesForAction = (action: string): number => {
    const level = securityLevels[action] || securityLevels['default'] || 'managed';
    switch (level) {
      case 'interactive':
        return 1; // Single use for high-security
      case 'non-interactive':
        return 10; // Multiple uses for low-security
      case 'managed':
      default:
        return 5; // Moderate use for balanced security
    }
  };

  // Get or create a token for a specific action
  const getToken = useCallback(async (action: string = 'default'): Promise<string> => {
    // Always fetch new token for high-security actions
    const isHighSecurity = securityLevels[action] === 'interactive';
    if (isHighSecurity) {
      return executeChallenge(action);
    }

    // Check if we have a valid cached token
    const cachedToken = tokens.get(action);
    if (cachedToken && isTokenValid(cachedToken)) {
      // Increment usage if tracking is enabled
      if (cachedToken.uses !== undefined) {
        cachedToken.uses++;
        setTokens(prev => new Map(prev).set(action, cachedToken));
      }
      return cachedToken.token;
    }

    // Execute challenge to get a new token
    return executeChallenge(action);
  }, [tokens, securityLevels]);

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

  // Execute a challenge to get a new token
  const executeChallenge = useCallback(async (action: string = 'default'): Promise<string> => {
    if (!isReady || !window.turnstile || !siteKey) {
      throw new Error('Turnstile is not ready');
    }

    return new Promise((resolve, reject) => {
      // Store currently focused element for restoration
      const previouslyFocusedElement = document.activeElement as HTMLElement;

      // Create a container for this specific challenge
      const challengeContainer = document.createElement('div');
      challengeContainer.setAttribute('role', 'dialog');
      challengeContainer.setAttribute('aria-modal', 'true');
      challengeContainer.setAttribute('aria-label', language === 'de' ? 'Sicherheitsüberprüfung' : 'Security verification');
      challengeContainer.style.position = 'fixed';
      challengeContainer.style.top = '50%';
      challengeContainer.style.left = '50%';
      challengeContainer.style.transform = 'translate(-50%, -50%)';
      challengeContainer.style.zIndex = '9999';
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.style.zIndex = '9998';

      let widgetId: string;

      const cleanup = () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.removeChild(challengeContainer);
        document.body.removeChild(backdrop);
        // Restore focus
        if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
          previouslyFocusedElement.focus();
        }
        if (widgetId) {
          window.turnstile?.remove(widgetId);
          widgetRefs.current.delete(action);
        }
      };

      // Keyboard handling for accessibility
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          reject(new Error('Challenge cancelled by user'));
        }
      };
      document.addEventListener('keydown', handleKeyDown);


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
        callback: (token: string) => {
          // Store the token with usage tracking
          const newToken: TurnstileToken = {
            token,
            timestamp: Date.now(),
            action,
            uses: 0,
            maxUses: getMaxUsesForAction(action),
          };
          setTokens(prev => new Map(prev).set(action, newToken));

          // Clean up
          cleanup();
          resolve(token);
        },
        'error-callback': () => {
          // Clean up
          cleanup();
          reject(new Error('Turnstile challenge failed'));
        },
        'expired-callback': () => {
          // Remove expired token
          setTokens(prev => {
            const newTokens = new Map(prev);
            newTokens.delete(action);
            return newTokens;
          });
        },
      };

      try {
        widgetId = window.turnstile.render(challengeContainer, options);
        widgetRefs.current.set(action, widgetId);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }, [isReady, siteKey, language, getAppearanceForAction, getMaxUsesForAction]);

  // Preload a token for better UX (optional)
  const preloadToken = useCallback(async (action: string = 'pageload'): Promise<void> => {
    if (!isReady) return;
    
    try {
      await getToken(action);
    } catch (error) {
      // Silently fail preloading
      console.warn('Failed to preload token:', error);
    }
  }, [isReady, getToken]);

  // Optional: Pre-warm cache on initialization
  useEffect(() => {
    if (isReady && !tokens.has('pageload')) {
      preloadToken().catch(() => {});
    }
  }, [isReady, tokens, preloadToken]);

  // Clear a specific token
  const clearToken = useCallback((action: string = 'default') => {
    setTokens(prev => {
      const newTokens = new Map(prev);
      newTokens.delete(action);
      return newTokens;
    });

    // Remove widget if it exists
    const widgetId = widgetRefs.current.get(action);
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId);
      widgetRefs.current.delete(action);
    }
  }, []);

  const contextValue: TurnstileContextValue = {
    isReady,
    isLoading,
    error,
    tokens,
    getToken,
    clearToken,
    executeChallenge,
    preloadToken,
  };

  return (
    <TurnstileContext.Provider value={contextValue}>
      {children}
      {/* Hidden container for pre-clearance if needed */}
      <div ref={containerRef} style={{ display: 'none' }} />
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

export default TurnstileProvider;