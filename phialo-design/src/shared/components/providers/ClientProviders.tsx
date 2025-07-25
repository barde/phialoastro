import React, { useState, useEffect } from 'react';
import { TurnstileProvider } from '../../contexts/TurnstileProvider';

interface ClientProvidersProps {
  children: React.ReactNode;
  skipTurnstile?: boolean;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children, skipTurnstile = false }) => {
  const [language, setLanguage] = useState<'de' | 'en'>('de');

  useEffect(() => {
    // Get language from URL
    const isGerman = !window.location.pathname.startsWith('/en/');
    setLanguage(isGerman ? 'de' : 'en');
  }, []);

  // If Turnstile is not configured or should be skipped, just render children
  if (!import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || skipTurnstile) {
    return <>{children}</>;
  }

  return (
    <TurnstileProvider 
      siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
      appearance="execute"
      language={language}
    >
      {children}
    </TurnstileProvider>
  );
};

export default ClientProviders;