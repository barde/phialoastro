import React, { Suspense } from 'react';
import { TurnstileProvider } from '../../../shared/contexts/TurnstileProvider';

// Lazy load the heavy contact form to reduce initial bundle size
const ContactFormWithPreClearance = React.lazy(() => import('./ContactFormWithPreClearance'));

interface ContactFormWrapperProps {
  lang: 'en' | 'de';
}

// Loading component for contact form
function ContactFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="form-group">
        <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="form-group">
        <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="form-group">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="form-group">
        <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="form-group">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-24 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="form-group">
        <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function ContactFormWrapper({ lang }: ContactFormWrapperProps) {
  return (
    <TurnstileProvider>
      <Suspense fallback={<ContactFormSkeleton />}>
        <ContactFormWithPreClearance lang={lang} />
      </Suspense>
    </TurnstileProvider>
  );
}