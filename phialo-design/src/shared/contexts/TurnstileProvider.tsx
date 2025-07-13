import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TurnstileOptions } from '../types/turnstile';

interface TurnstileToken {
  token: string;
  timestamp: number;
  action?: string;
}

interface TurnstileContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: Map<string, TurnstileToken>;
  getToken: (action?: string) => Promise<string>;
  clearToken: (action?: string) => void;
  executeChallenge: (action?: string) => Promise<string>;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

interface TurnstileProviderProps {
  children: React.ReactNode;
  siteKey?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  language?: 'auto' | 'de' | 'en';
}

export const TurnstileProvider: React.FC<TurnstileProviderProps> = ({
  children,
  siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY,
  appearance = 'execute',
  language = 'auto',
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
    return Date.now() - token.timestamp < TOKEN_EXPIRY;
  };

  // Get or create a token for a specific action
  const getToken = useCallback(async (action: string = 'default'): Promise<string> => {
    // Check if we have a valid cached token
    const cachedToken = tokens.get(action);
    if (cachedToken && isTokenValid(cachedToken)) {
      return cachedToken.token;
    }

    // Execute challenge to get a new token
    return executeChallenge(action);
  }, [tokens]);

  // Execute a challenge to get a new token
  const executeChallenge = useCallback(async (action: string = 'default'): Promise<string> => {
    if (!isReady || !window.turnstile || !siteKey) {
      throw new Error('Turnstile is not ready');
    }

    return new Promise((resolve, reject) => {
      // Create a container for this specific challenge
      const challengeContainer = document.createElement('div');
      challengeContainer.style.position = 'fixed';
      challengeContainer.style.top = '50%';
      challengeContainer.style.left = '50%';
      challengeContainer.style.transform = 'translate(-50%, -50%)';
      challengeContainer.style.zIndex = '9999';
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.style.zIndex = '9998';

      document.body.appendChild(backdrop);
      document.body.appendChild(challengeContainer);

      const options: TurnstileOptions = {
        sitekey: siteKey,
        action,
        appearance,
        language,
        theme: 'auto',
        callback: (token: string) => {
          // Store the token
          const newToken: TurnstileToken = {
            token,
            timestamp: Date.now(),
            action,
          };
          setTokens(prev => new Map(prev).set(action, newToken));

          // Clean up
          document.body.removeChild(challengeContainer);
          document.body.removeChild(backdrop);
          if (widgetId) {
            window.turnstile?.remove(widgetId);
            widgetRefs.current.delete(action);
          }

          resolve(token);
        },
        'error-callback': () => {
          // Clean up
          document.body.removeChild(challengeContainer);
          document.body.removeChild(backdrop);
          if (widgetId) {
            window.turnstile?.remove(widgetId);
            widgetRefs.current.delete(action);
          }

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
        const widgetId = window.turnstile.render(challengeContainer, options);
        widgetRefs.current.set(action, widgetId);
      } catch (error) {
        document.body.removeChild(challengeContainer);
        document.body.removeChild(backdrop);
        reject(error);
      }
    });
  }, [isReady, siteKey, appearance, language]);

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