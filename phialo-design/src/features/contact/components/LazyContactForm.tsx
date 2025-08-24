import { lazy, Suspense } from 'react';

// Lazy load the contact form to reduce initial bundle
const ContactFormWrapper = lazy(() => import('./ContactFormWrapper'));

export default function LazyContactForm() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading form...</div>
      </div>
    }>
      <ContactFormWrapper />
    </Suspense>
  );
}