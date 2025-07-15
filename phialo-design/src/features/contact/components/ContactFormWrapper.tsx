import React from 'react';
import ContactForm from './ContactForm';
import ContactFormWithPreClearance from './ContactFormWithPreClearance';
import ClientProviders from '../../../shared/components/providers/ClientProviders';

interface ContactFormWrapperProps {
  onSuccess?: () => void;
  usePreClearance?: boolean;
}

// Wrapper component that decides which form to use
export const ContactFormWrapper: React.FC<ContactFormWrapperProps> = ({ 
  onSuccess, 
  usePreClearance = true 
}) => {
  // Use pre-clearance form if enabled and Turnstile is configured
  if (usePreClearance && import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) {
    return (
      <ClientProviders>
        <ContactFormWithPreClearance onSuccess={onSuccess} />
      </ClientProviders>
    );
  }
  
  // Fall back to regular form with widget (no provider needed)
  return <ContactForm onSuccess={onSuccess} />;
};

export default ContactFormWrapper;