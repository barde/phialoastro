import React from 'react';
import ContactFormWithPreClearance from './ContactFormWithPreClearance';
import ContactForm from './ContactForm';
import ClientProviders from '../../../shared/components/providers/ClientProviders';

interface ContactFormWrapperProps {
  onSuccess?: () => void;
  usePreClearance?: boolean;
}

// Wrapper component that decides which form to use and whether to include providers
export const ContactFormWrapper: React.FC<ContactFormWrapperProps> = ({ 
  onSuccess, 
  usePreClearance = true 
}) => {
  // Use pre-clearance if Turnstile is configured and usePreClearance is true
  const shouldUsePreClearance = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && usePreClearance;

  if (shouldUsePreClearance) {
    return (
      <ClientProviders>
        <ContactFormWithPreClearance onSuccess={onSuccess} />
      </ClientProviders>
    );
  }

  // Fallback to regular ContactForm (which has its own widget)
  return <ContactForm onSuccess={onSuccess} />;
};

export default ContactFormWrapper;