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
    // Check if Turnstile is already loaded
    const checkAndRender = () => {
      if (containerRef.current && window.turnstile) {
        const options: TurnstileOptions = {
          sitekey: siteKey,
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme: 'light',
          language: 'auto',
        } as TurnstileOptions;
        widgetIdRef.current = window.turnstile!.render(containerRef.current, options);
      }
    };

    // If Turnstile is already loaded, render immediately
    if (window.turnstile) {
      checkAndRender();
    } else {
      // Wait for Turnstile to load (it's loaded globally in BaseLayout)
      const intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          checkAndRender();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
      }, 10000);

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        // Cleanup widget
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      };
    }

    return () => {
      // Cleanup widget
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  return <div ref={containerRef} className="cf-turnstile" />;
};