import React, { useState, useEffect } from 'react';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useTurnstile } from '../../../shared/contexts/TurnstileProvider';

// Translation types
interface Translations {
  nameLabel: string;
  namePlaceholder: string;
  nameRequired: string;
  nameInvalid: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailRequired: string;
  emailInvalid: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneInvalid: string;
  messageLabel: string;
  messagePlaceholder: string;
  messageRequired: string;
  messageTooShort: string;
  submitButton: string;
  submitting: string;
  sendCopyLabel: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  subjectRequired: string;
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorNetwork: string;
  errorValidation: string;
  errorServer: string;
  errorUnknown: string;
  errorInvalidKey: string;
  tryAgain: string;
  closeButton: string;
  errorTurnstile: string;
  loadingTurnstile: string;
}

// Form data interface
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  sendCopy: boolean;
}

// Validation errors interface
interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

// Props interface
interface ContactFormProps {
  onSuccess?: () => void;
}

const ContactFormWithPreClearance: React.FC<ContactFormProps> = ({ onSuccess }) => {
  // State management
  const [isHydrated, setIsHydrated] = useState(false);
  const [isGerman, setIsGerman] = useState(true);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    sendCopy: true
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Use Turnstile context
  const { isReady, isLoading, getToken, error: turnstileError } = useTurnstile();

  // Form persistence
  const { clearPersistedData } = useFormPersistence<ContactFormData>(formData, setFormData, {
    storageKey: 'phialo-contact-form',
    excludeFields: [],
    clearOnSuccess: true
  });

  // Check language on mount
  useEffect(() => {
    setIsGerman(!window.location.pathname.startsWith('/en/'));
    setIsHydrated(true);
  }, []);

  // Translations
  const translations: Record<'de' | 'en', Translations> = {
    de: {
      nameLabel: 'Name',
      namePlaceholder: 'Ihr Name',
      nameRequired: 'Name ist erforderlich',
      nameInvalid: 'Bitte geben Sie einen gültigen Namen ein',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'ihre.email@beispiel.de',
      emailRequired: 'E-Mail ist erforderlich',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      phoneLabel: 'Telefon (optional)',
      phonePlaceholder: '+49 123 456789',
      phoneInvalid: 'Bitte geben Sie eine gültige Telefonnummer ein',
      messageLabel: 'Nachricht',
      messagePlaceholder: 'Ihre Nachricht...',
      messageRequired: 'Nachricht ist erforderlich',
      messageTooShort: 'Die Nachricht muss mindestens 10 Zeichen lang sein',
      submitButton: 'Nachricht senden',
      submitting: 'Wird gesendet...',
      sendCopyLabel: 'Eine Kopie dieser Nachricht an meine E-Mail senden',
      subjectLabel: 'Betreff',
      subjectPlaceholder: 'Betreff Ihrer Nachricht',
      subjectRequired: 'Betreff ist erforderlich',
      successTitle: 'Nachricht gesendet!',
      successMessage: 'Vielen Dank für Ihre Nachricht. Wir werden uns so schnell wie möglich bei Ihnen melden.',
      errorTitle: 'Fehler beim Senden',
      errorNetwork: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
      errorValidation: 'Bitte überprüfen Sie Ihre Eingaben.',
      errorServer: 'Serverfehler. Bitte versuchen Sie es später erneut.',
      errorUnknown: 'Ein unbekannter Fehler ist aufgetreten.',
      errorInvalidKey: 'Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
      tryAgain: 'Erneut versuchen',
      closeButton: 'Schließen',
      errorTurnstile: 'Sicherheitsüberprüfung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      loadingTurnstile: 'Sicherheitsüberprüfung wird geladen...',
    },
    en: {
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      nameRequired: 'Name is required',
      nameInvalid: 'Please enter a valid name',
      emailLabel: 'Email',
      emailPlaceholder: 'your.email@example.com',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      phoneLabel: 'Phone (optional)',
      phonePlaceholder: '+49 123 456789',
      phoneInvalid: 'Please enter a valid phone number',
      messageLabel: 'Message',
      messagePlaceholder: 'Your message...',
      messageRequired: 'Message is required',
      messageTooShort: 'Message must be at least 10 characters long',
      submitButton: 'Send Message',
      submitting: 'Sending...',
      sendCopyLabel: 'Send me a copy of this message',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'Subject of your message',
      subjectRequired: 'Subject is required',
      successTitle: 'Message Sent!',
      successMessage: 'Thank you for your message. We will get back to you as soon as possible.',
      errorTitle: 'Failed to Send',
      errorNetwork: 'Network error. Please check your internet connection.',
      errorValidation: 'Please check your input.',
      errorServer: 'Server error. Please try again later.',
      errorUnknown: 'An unknown error occurred.',
      errorInvalidKey: 'Configuration error. Please contact the administrator.',
      tryAgain: 'Try Again',
      closeButton: 'Close',
      errorTurnstile: 'Security verification failed. Please try again.',
      loadingTurnstile: 'Loading security verification...',
    }
  };

  const t = translations[isGerman ? 'de' : 'en'];

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return t.nameRequired;
    if (name.length < 2 || name.length > 100) return t.nameInvalid;
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return t.emailRequired;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t.emailInvalid;
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined; // Optional field
    const phoneRegex = /^[\d\s+\-()]+$/;
    if (!phoneRegex.test(phone) || phone.length < 6) return t.phoneInvalid;
    return undefined;
  };

  const validateSubject = (subject: string): string | undefined => {
    if (!subject.trim()) return t.subjectRequired;
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message.trim()) return t.messageRequired;
    if (message.length < 10) return t.messageTooShort;
    return undefined;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    let error: string | undefined;
    switch (name) {
      case 'name':
        error = validateName(formData.name);
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'phone':
        error = validatePhone(formData.phone);
        break;
      case 'subject':
        error = validateSubject(formData.subject);
        break;
      case 'message':
        error = validateMessage(formData.message);
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const subjectError = validateSubject(formData.subject);
    if (subjectError) newErrors.subject = subjectError;
    
    const messageError = validateMessage(formData.message);
    if (messageError) newErrors.message = messageError;
    
    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Get Turnstile token using pre-clearance
      let turnstileToken = '';
      
      if (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) {
        if (!isReady) {
          throw new Error(t.loadingTurnstile);
        }
        
        try {
          turnstileToken = await getToken('contact-form');
        } catch (error) {
          console.error('Turnstile error:', error);
          throw new Error(t.errorTurnstile);
        }
      }

      // Prepare form data for API
      const apiData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject,
        message: formData.message,
        language: isGerman ? 'de' : 'en',
        sendCopy: formData.sendCopy,
        turnstileToken
      };

      // Submit to API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to send message');
      }
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', sendCopy: true });
      setTouched({});
      
      // Clear persisted data after successful submission
      clearPersistedData();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      
      // Determine error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage(t.errorNetwork);
      } else if (error instanceof Error && error.message === t.errorTurnstile) {
        setErrorMessage(t.errorTurnstile);
      } else if (error instanceof Error && error.message === t.loadingTurnstile) {
        setErrorMessage(t.loadingTurnstile);
      } else if (error instanceof Error && (error.message.toLowerCase().includes('access key') || error.message.toLowerCase().includes('invalid access key'))) {
        setErrorMessage(t.errorInvalidKey);
      } else if (error instanceof Error && error.message.includes('validation')) {
        setErrorMessage(t.errorValidation);
      } else if (error instanceof Error && error.message.includes('server')) {
        setErrorMessage(t.errorServer);
      } else {
        setErrorMessage(t.errorUnknown);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({ name: '', email: '', phone: '', subject: '', message: '', sendCopy: true });
    setErrors({});
    setTouched({});
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  // Prevent hydration mismatch by not rendering until client-side language is determined
  if (!isHydrated) {
    return null;
  }

  return (
    <div className="relative">
      <form action="/api/contact" method="POST" onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t.nameLabel} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.name && !!errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-300 ${
              touched.name && errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder={t.namePlaceholder}
            disabled={isSubmitting}
          />
          {touched.name && errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t.emailLabel} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.email && !!errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-300 ${
              touched.email && errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder={t.emailPlaceholder}
            disabled={isSubmitting}
          />
          {touched.email && errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {t.phoneLabel}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.phone && !!errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-300 ${
              touched.phone && errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder={t.phonePlaceholder}
            disabled={isSubmitting}
          />
          {touched.phone && errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Subject Field */}
        <div className="form-group">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            {t.subjectLabel} *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={touched.subject && !!errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-300 ${
              touched.subject && errors.subject ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder={t.subjectPlaceholder}
            disabled={isSubmitting}
          />
          {touched.subject && errors.subject && (
            <p id="subject-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div className="form-group">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            {t.messageLabel} *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            required
            aria-invalid={touched.message && !!errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-300 resize-none ${
              touched.message && errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder={t.messagePlaceholder}
            disabled={isSubmitting}
          />
          {touched.message && errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.message}
            </p>
          )}
        </div>

        {/* Turnstile status (only shown during loading or error) */}
        {import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && (isLoading || turnstileError) && (
          <div className="form-group">
            {isLoading && (
              <p className="text-sm text-gray-600">{t.loadingTurnstile}</p>
            )}
            {turnstileError && (
              <p className="text-sm text-red-400" role="alert">{t.errorTurnstile}</p>
            )}
          </div>
        )}

        {/* Send Copy Checkbox */}
        <div className="form-group">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="sendCopy"
              name="sendCopy"
              checked={formData.sendCopy}
              onChange={(e) => setFormData(prev => ({ ...prev, sendCopy: e.target.checked }))}
              className="w-4 h-4 text-gold bg-white border-gray-300 rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
              disabled={isSubmitting}
            />
            <span className="ml-2 text-sm text-gray-700">{t.sendCopyLabel}</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="form-group">
          <button
            type="submit"
            disabled={isSubmitting || (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && !isReady)}
            className="w-full px-6 py-3 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-white font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed"
          >
            {isSubmitting ? t.submitting : t.submitButton}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {submitStatus === 'success' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-green-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900">{t.successTitle}</h3>
            </div>
            <p className="text-gray-600 mb-6">{t.successMessage}</p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="w-full px-4 py-2 bg-gold hover:bg-gold/90 text-white font-medium rounded-lg transition-colors"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {submitStatus === 'error' && (
        <div role="dialog" aria-modal="true" aria-labelledby="error-title" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 id="error-title" className="text-xl font-medium text-gray-900">{t.errorTitle}</h3>
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                {t.closeButton}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {t.tryAgain}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactFormWithPreClearance;