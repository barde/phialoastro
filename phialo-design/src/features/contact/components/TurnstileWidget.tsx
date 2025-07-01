import React, { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  sitekey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  sitekey,
  onSuccess,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        renderWidget();
      };
      
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    function renderWidget() {
      if (containerRef.current && window.turnstile) {
        // Clear any existing widget
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Widget might already be removed
          }
        }

        // Render new widget
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme,
          size,
          callback: onSuccess,
          'error-callback': onError,
          'expired-callback': onExpire,
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget might already be removed
        }
      }
    };
  }, [sitekey, theme, size, onSuccess, onError, onExpire]);

  return (
    <div 
      ref={containerRef} 
      className={`cf-turnstile ${className}`}
      data-sitekey={sitekey}
      data-theme={theme}
      data-size={size}
    />
  );
};

export default TurnstileWidget;