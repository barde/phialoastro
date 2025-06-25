import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isGerman: boolean;
}

class ContactFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isGerman: true
    };
  }

  componentDidMount() {
    // Check language on mount
    this.setState({
      isGerman: !window.location.pathname.startsWith('/en/')
    });
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ContactForm Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { isGerman } = this.state;

      // Translations for error messages
      const errorMessages = {
        de: {
          title: 'Ups! Etwas ist schief gelaufen',
          description: 'Es gab ein Problem mit dem Kontaktformular. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.',
          contactEmail: 'E-Mail: kontakt@phialo.de',
          contactPhone: 'Telefon: (+49) 1578 566 47 00',
          tryAgain: 'Erneut versuchen',
          technicalDetails: 'Technische Details',
          reportIssue: 'Problem melden'
        },
        en: {
          title: 'Oops! Something went wrong',
          description: 'There was a problem with the contact form. Please try again later or contact us directly.',
          contactEmail: 'Email: kontakt@phialo.de',
          contactPhone: 'Phone: (+49) 1578 566 47 00',
          tryAgain: 'Try Again',
          technicalDetails: 'Technical Details',
          reportIssue: 'Report Issue'
        }
      };

      const t = errorMessages[isGerman ? 'de' : 'en'];

      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-lg">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Error Message */}
            <h3 className="text-2xl font-display font-medium text-gray-900 mb-4">{t.title}</h3>
            <p className="text-gray-600 mb-6">{t.description}</p>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-2">{t.contactEmail}</p>
              <p className="text-gray-700">{t.contactPhone}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-gold hover:bg-gold/90 text-white font-medium rounded-lg transition-colors"
              >
                {t.tryAgain}
              </button>
            </div>

            {/* Technical Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors">
                  {t.technicalDetails}
                </summary>
                <div className="mt-2 p-4 bg-black/50 rounded-lg overflow-auto">
                  <p className="text-red-400 font-mono text-sm mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-gray-400 font-mono text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ContactFormErrorBoundary;