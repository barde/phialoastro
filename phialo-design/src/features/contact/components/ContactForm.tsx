import React, { useState, useEffect } from 'react';
import { useFormPersistence } from '../hooks/useFormPersistence';
import TurnstileWidget from './TurnstileWidget';

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

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess }) => {
  // State management
  const [isGerman, setIsGerman] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState(false);
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

  // Form persistence
  const { clearPersistedData } = useFormPersistence<ContactFormData>(formData, setFormData, {
    storageKey: 'phialo-contact-form',
    excludeFields: [], // We want to persist all fields
    clearOnSuccess: true
  });

  // Check language on mount
  useEffect(() => {
    setIsGerman(!window.location.pathname.startsWith('/en/'));
  }, []);

  // Translations
  const translations: Record<'de' | 'en', Translations> = {
    de: {
      nameLabel: 'Name',
      namePlaceholder: 'Ihr Name',
      nameRequired: 'Name ist erforderlich',
      nameInvalid: 'Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen)',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'ihre.email@example.com',
      emailRequired: 'E-Mail ist erforderlich',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      phoneLabel: 'Telefon',
      phonePlaceholder: 'Ihre Telefonnummer',
      phoneInvalid: 'Bitte geben Sie eine gültige Telefonnummer ein',
      messageLabel: 'Nachricht',
      messagePlaceholder: 'Beschreiben Sie Ihr Projekt oder Ihre Anfrage...',
      messageRequired: 'Nachricht ist erforderlich',
      messageTooShort: 'Die Nachricht sollte mindestens 10 Zeichen lang sein',
      submitButton: 'Nachricht senden',
      submitting: 'Wird gesendet...',
      sendCopyLabel: 'Eine Kopie an meine E-Mail senden',
      subjectLabel: 'Betreff',
      subjectPlaceholder: 'Worum geht es?',
      subjectRequired: 'Betreff ist erforderlich',
      successTitle: 'Erfolg!',
      successMessage: 'Ihre Nachricht wurde erfolgreich gesendet. Wir werden uns innerhalb von 24 Stunden bei Ihnen melden.',
      errorTitle: 'Fehler',
      errorNetwork: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
      errorValidation: 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
      errorServer: 'Serverfehler. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt per E-Mail.',
      errorUnknown: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      errorInvalidKey: 'Konfigurationsfehler: Ungültiger Access Key',
      tryAgain: 'Erneut versuchen',
      closeButton: 'Schließen'
    },
    en: {
      nameLabel: 'Name',
      namePlaceholder: 'Your Name',
      nameRequired: 'Name is required',
      nameInvalid: 'Please enter a valid name (at least 2 characters)',
      emailLabel: 'Email',
      emailPlaceholder: 'your.email@example.com',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Your phone number',
      phoneInvalid: 'Please enter a valid phone number',
      messageLabel: 'Message',
      messagePlaceholder: 'Describe your project or inquiry...',
      messageRequired: 'Message is required',
      messageTooShort: 'Message should be at least 10 characters long',
      submitButton: 'Send Message',
      submitting: 'Sending...',
      sendCopyLabel: 'Send a copy to my email',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'What is this about?',
      subjectRequired: 'Subject is required',
      successTitle: 'Success!',
      successMessage: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      errorTitle: 'Error',
      errorNetwork: 'Network error. Please check your internet connection and try again.',
      errorValidation: 'Please check your input and try again.',
      errorServer: 'Server error. Please try again later or contact us directly via email.',
      errorUnknown: 'An unexpected error occurred. Please try again.',
      errorInvalidKey: 'Configuration error: Invalid access key',
      tryAgain: 'Try Again',
      closeButton: 'Close'
    }
  };

  const t = translations[isGerman ? 'de' : 'en'];

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    // Allow various phone formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t.nameInvalid;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t.emailInvalid;
    }

    // Phone validation (optional)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = t.phoneInvalid;
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = t.subjectRequired;
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = t.messageRequired;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t.messageTooShort;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // Handle field blur (for showing errors)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate single field on blur
    const fieldErrors: ValidationErrors = {};
    
    switch (name) {
      case 'name':
        if (!formData.name.trim()) {
          fieldErrors.name = t.nameRequired;
        } else if (formData.name.trim().length < 2) {
          fieldErrors.name = t.nameInvalid;
        }
        break;
      case 'email':
        if (!formData.email.trim()) {
          fieldErrors.email = t.emailRequired;
        } else if (!validateEmail(formData.email)) {
          fieldErrors.email = t.emailInvalid;
        }
        break;
      case 'phone':
        if (formData.phone && !validatePhone(formData.phone)) {
          fieldErrors.phone = t.phoneInvalid;
        }
        break;
      case 'subject':
        if (!formData.subject.trim()) {
          fieldErrors.subject = t.subjectRequired;
        }
        break;
      case 'message':
        if (!formData.message.trim()) {
          fieldErrors.message = t.messageRequired;
        } else if (formData.message.trim().length < 10) {
          fieldErrors.message = t.messageTooShort;
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    });

    // Validate form
    if (!validateForm()) {
      setErrorMessage(t.errorValidation);
      return;
    }

    // Check if Turnstile is configured and valid
    const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
    if (turnstileSiteKey && !turnstileToken) {
      setErrorMessage(isGerman ? 'Bitte bestätigen Sie, dass Sie kein Roboter sind.' : 'Please confirm you are not a robot.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {

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

      // Submit to new API endpoint
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

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

        {/* Turnstile Widget */}
        {import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="form-group">
            <TurnstileWidget
              sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileError(false);
              }}
              onError={() => {
                setTurnstileError(true);
                setTurnstileToken('');
              }}
              onExpire={() => {
                setTurnstileToken('');
              }}
              theme="light"
              className="mb-2"
            />
            {turnstileError && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {isGerman ? 'Captcha-Überprüfung fehlgeschlagen. Bitte versuchen Sie es erneut.' : 'Captcha verification failed. Please try again.'}
              </p>
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
            disabled={isSubmitting}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900">{t.errorTitle}</h3>
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-gold hover:bg-gold/90 text-white font-medium rounded-lg transition-colors"
              >
                {t.tryAgain}
              </button>
              <button
                onClick={() => setSubmitStatus('idle')}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {t.closeButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactForm;