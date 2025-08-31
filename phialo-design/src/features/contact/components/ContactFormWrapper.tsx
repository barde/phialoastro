import React from 'react';
import { TurnstileProvider } from '../../../shared/contexts/TurnstileProvider';
import ContactFormWithPreClearance from './ContactFormWithPreClearance';

interface ContactFormWrapperProps {
  lang: 'en' | 'de';
}

export default function ContactFormWrapper({ lang }: ContactFormWrapperProps) {
  return (
    <TurnstileProvider>
      <ContactFormWithPreClearance lang={lang} />
    </TurnstileProvider>
  );
}