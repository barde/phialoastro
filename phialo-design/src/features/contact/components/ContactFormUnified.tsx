import React, { useState } from 'react';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useTurnstile } from '../../../shared/contexts/TurnstileProvider';
import { TurnstileWidget } from './TurnstileWidget';
import { useTranslations, type Language } from '../../../i18n/ui';

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
  lang?: Language;
  onSuccess?: () => void;
  usePreClearance?: boolean;
}

const ContactFormUnified: React.FC<ContactFormProps> = ({ 
  lang = 'de', 
  onSuccess,
  usePreClearance = false 
}) => {
  // Get translations
  const t = useTranslations(lang);
  const isGerman = lang === 'de';
  
  // State management
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
  
  // Turnstile state for traditional widget mode
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileWidgetError, setTurnstileWidgetError] = useState(false);
  
  // Use Turnstile context for pre-clearance mode
  const turnstileContext = usePreClearance ? useTurnstile() : null;

  // Form persistence
  const { clearPersistedData } = useFormPersistence<ContactFormData>(formData, setFormData, {
    storageKey: 'phialo-contact-form',
    excludeFields: [],
    clearOnSuccess: true
  });

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return isGerman ? 'Name ist erforderlich' : 'Name is required';
    }
    if (name.trim().length < 2) {
      return isGerman ? 'Name muss mindestens 2 Zeichen lang sein' : 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-ZäöüÄÖÜß\s'-]+$/.test(name)) {
      return isGerman ? 'Name enthält ungültige Zeichen' : 'Name contains invalid characters';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return isGerman ? 'E-Mail ist erforderlich' : 'Email is required';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return isGerman ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return isGerman ? 'Telefonnummer enthält ungültige Zeichen' : 'Phone number contains invalid characters';
    }
    return undefined;
  };

  const validateSubject = (subject: string): string | undefined => {
    if (!subject.trim()) {
      return isGerman ? 'Betreff ist erforderlich' : 'Subject is required';
    }
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message.trim()) {
      return isGerman ? 'Nachricht ist erforderlich' : 'Message is required';
    }
    if (message.trim().length < 10) {
      return isGerman ? 'Nachricht muss mindestens 10 Zeichen lang sein' : 'Message must be at least 10 characters';
    }
    return undefined;
  };

  // Form validation
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
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle field blur
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    let error: string | undefined;
    switch (fieldName) {
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
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalTurnstileToken = '';
      
      // Handle Turnstile token based on mode
      if (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) {
        if (usePreClearance) {
          // Pre-clearance mode
          if (!turnstileContext?.isReady) {
            setErrorMessage(isGerman ? 'Turnstile wird noch geladen...' : 'Turnstile is still loading...');
            setIsSubmitting(false);
            return;
          }
          finalTurnstileToken = await turnstileContext.getToken('contact-form');
        } else {
          // Traditional widget mode
          if (!turnstileToken) {
            setErrorMessage(isGerman ? 'Bitte bestätigen Sie, dass Sie kein Roboter sind' : 'Please verify you are not a robot');
            setIsSubmitting(false);
            return;
          }
          finalTurnstileToken = turnstileToken;
        }
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language: isGerman ? 'de' : 'en',
          turnstileToken: finalTurnstileToken
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        clearPersistedData();
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          sendCopy: true
        });
        setTurnstileToken('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.message || (isGerman ? 'Ein unbekannter Fehler ist aufgetreten' : 'An unknown error occurred'));
      }
    } catch (error) {
      setSubmitStatus('error');
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setErrorMessage(isGerman ? 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.' : 'Network error. Please check your internet connection.');
      } else {
        setErrorMessage(isGerman ? 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' : 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Turnstile section based on mode
  const renderTurnstileSection = () => {
    if (!import.meta.env.PUBLIC_TURNSTILE_SITE_KEY) return null;
    
    if (usePreClearance) {
      // Pre-clearance status display
      if (turnstileContext?.isLoading || turnstileContext?.error) {
        return (
          <div className="mb-6">
            {turnstileContext.isLoading && (
              <p className="text-sm text-gray-600">
                {isGerman ? 'Sicherheitsprüfung wird geladen...' : 'Loading security check...'}
              </p>
            )}
            {turnstileContext.error && (
              <p className="text-sm text-red-500">
                {isGerman ? 'Fehler bei der Sicherheitsprüfung' : 'Security check error'}
              </p>
            )}
          </div>
        );
      }
      return null;
    } else {
      // Traditional widget rendering
      return (
        <div className="mb-6">
          <TurnstileWidget
            siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={(token) => {
              setTurnstileToken(token);
              setTurnstileWidgetError(false);
            }}
            onError={() => setTurnstileWidgetError(true)}
            onExpire={() => setTurnstileToken('')}
            theme="light"
            language={isGerman ? 'de' : 'en'}
          />
          {turnstileWidgetError && (
            <p className="mt-2 text-sm text-red-500">
              {isGerman ? 'Fehler bei der Überprüfung. Bitte laden Sie die Seite neu.' : 'Verification error. Please reload the page.'}
            </p>
          )}
        </div>
      );
    }
  };

  // Determine if submit button should be disabled
  const isSubmitDisabled = isSubmitting || 
    (usePreClearance && import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && !turnstileContext?.isReady);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.form.name')} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            onBlur={() => handleBlur('name')}
            className={`w-full px-4 py-3 rounded-lg border ${
              touched.name && errors.name ? 'border-red-400' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
            placeholder={isGerman ? 'Max Mustermann' : 'John Doe'}
          />
          {touched.name && errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.form.email')} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            onBlur={() => handleBlur('email')}
            className={`w-full px-4 py-3 rounded-lg border ${
              touched.email && errors.email ? 'border-red-400' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
            placeholder={isGerman ? 'max@beispiel.de' : 'john@example.com'}
          />
          {touched.email && errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.phone')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            onBlur={() => handleBlur('phone')}
            className={`w-full px-4 py-3 rounded-lg border ${
              touched.phone && errors.phone ? 'border-red-400' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
            placeholder={isGerman ? '+49 123 456789' : '+1 234 567890'}
          />
          {touched.phone && errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            {isGerman ? 'Betreff' : 'Subject'} *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleInputChange}
            onBlur={() => handleBlur('subject')}
            className={`w-full px-4 py-3 rounded-lg border ${
              touched.subject && errors.subject ? 'border-red-400' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
            placeholder={isGerman ? 'Ihre Anfrage' : 'Your inquiry'}
          />
          {touched.subject && errors.subject && (
            <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            {t('contact.form.message')} *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleInputChange}
            onBlur={() => handleBlur('message')}
            className={`w-full px-4 py-3 rounded-lg border ${
              touched.message && errors.message ? 'border-red-400' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none`}
            placeholder={isGerman ? 'Ihre Nachricht...' : 'Your message...'}
          />
          {touched.message && errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message}</p>
          )}
        </div>

        {/* Send Copy Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sendCopy"
            name="sendCopy"
            checked={formData.sendCopy}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary focus:ring-primary/20 border-gray-300 rounded"
          />
          <label htmlFor="sendCopy" className="ml-2 text-sm text-gray-700">
            {isGerman ? 'Kopie an mich senden' : 'Send me a copy'}
          </label>
        </div>

        {/* Turnstile Section */}
        {renderTurnstileSection()}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
            isSubmitDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
        </button>
      </form>

      {/* Success Modal */}
      {submitStatus === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isGerman ? 'Nachricht gesendet!' : 'Message Sent!'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('contact.form.success')}
              </p>
              <button
                onClick={() => setSubmitStatus('idle')}
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {submitStatus === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('common.error')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {errorMessage || t('contact.form.error')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    setSubmitStatus('idle');
                    const submitEvent = new Event('submit') as React.FormEvent;
                    handleSubmit(submitEvent);
                  }}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {isGerman ? 'Erneut versuchen' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactFormUnified;