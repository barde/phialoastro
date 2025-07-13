import React, { useEffect, useRef } from 'react';
import type { TurnstileOptions } from '../../../shared/types/turnstile';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (containerRef.current && window.turnstile) {
        const options: Partial<TurnstileOptions> = {
          sitekey: siteKey,
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme: 'light',
          language: 'auto',
        };
        widgetIdRef.current = window.turnstile!.render(containerRef.current, options);
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      document.head.removeChild(script);
    };
  }, [siteKey, onVerify, onError, onExpire]);

  return <div ref={containerRef} className="cf-turnstile" />;
};