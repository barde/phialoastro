import React from 'react';
import ContactForm from './ContactForm';

interface ContactFormWrapperProps {
  onSuccess?: () => void;
  usePreClearance?: boolean;
}

// Wrapper component that decides which form to use
export const ContactFormWrapper: React.FC<ContactFormWrapperProps> = ({ 
  onSuccess, 
  usePreClearance = true 
}) => {
  // For now, just use the regular ContactForm
  // The pre-clearance implementation needs to be fixed
  return <ContactForm onSuccess={onSuccess} />;
};

export default ContactFormWrapper;