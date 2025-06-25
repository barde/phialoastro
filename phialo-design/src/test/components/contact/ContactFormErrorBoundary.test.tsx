import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContactFormErrorBoundary from '../../../features/contact/components/ContactFormErrorBoundary';

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: 'http://localhost:4321/'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ContactFormErrorBoundary', () => {
  beforeEach(() => {
    // Reset location to German
    mockLocation.pathname = '/';
    // Clear console errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ContactFormErrorBoundary>
        <div>Test content</div>
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays error UI in German', () => {
    render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Ups! Etwas ist schief gelaufen')).toBeInTheDocument();
    expect(screen.getByText(/Es gab ein Problem mit dem Kontaktformular/)).toBeInTheDocument();
    expect(screen.getByText('E-Mail: kontakt@phialo.de')).toBeInTheDocument();
    expect(screen.getByText('Telefon: (+49) 1578 566 47 00')).toBeInTheDocument();
  });

  it('catches errors and displays error UI in English', async () => {
    mockLocation.pathname = '/en/contact';

    const { rerender } = render(
      <ContactFormErrorBoundary>
        <div>Initial content</div>
      </ContactFormErrorBoundary>
    );

    // Rerender with error
    rerender(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/There was a problem with the contact form/)).toBeInTheDocument();
    expect(screen.getByText('Email: kontakt@phialo.de')).toBeInTheDocument();
    expect(screen.getByText('Phone: (+49) 1578 566 47 00')).toBeInTheDocument();
  });

  it('allows resetting after error', () => {
    const { rerender } = render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Ups! Etwas ist schief gelaufen')).toBeInTheDocument();

    // Click try again
    const tryAgainButton = screen.getByText('Erneut versuchen');
    fireEvent.click(tryAgainButton);

    // Rerender with working component
    rerender(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Ups! Etwas ist schief gelaufen')).not.toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;
    
    render(
      <ContactFormErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Ups! Etwas ist schief gelaufen')).not.toBeInTheDocument();
  });

  it('logs errors to console in development', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    
    render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'ContactForm Error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('displays error icon', () => {
    render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    const errorIcon = screen.getByRole('img', { hidden: true });
    expect(errorIcon).toBeInTheDocument();
    expect(errorIcon.parentElement).toHaveClass('bg-red-500/20');
  });

  it('shows technical details in development mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('Technische Details')).toBeInTheDocument();
    
    // Click to expand details
    const detailsElement = screen.getByText('Technische Details');
    fireEvent.click(detailsElement);

    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('hides technical details in production mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ContactFormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ContactFormErrorBoundary>
    );

    expect(screen.queryByText('Technische Details')).not.toBeInTheDocument();

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
});