import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ContactFormWithPreClearance } from './ContactFormWithPreClearance';
import { TurnstileProvider } from '../../../shared/contexts/TurnstileProvider';

// Mock fetch
global.fetch = vi.fn();

// Mock window.turnstile
const mockTurnstile = {
  render: vi.fn(),
  remove: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
};

describe('ContactFormWithPreClearance', () => {
  const defaultProps = {
    isGerman: true,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup window mocks
    global.window = {
      turnstile: mockTurnstile,
      onloadTurnstileCallback: undefined,
      location: {
        pathname: '/',
      },
    } as any;
    
    // Mock document
    global.document = {
      createElement: vi.fn((tag: string) => {
        const element = {
          tagName: tag.toUpperCase(),
          style: {},
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          querySelector: vi.fn(),
          querySelectorAll: vi.fn(() => []),
          focus: vi.fn(),
        };
        return element;
      }),
      head: {
        appendChild: vi.fn(),
      },
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      querySelector: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      activeElement: { focus: vi.fn() },
      contains: vi.fn(() => true),
    } as any;

    // Default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Success' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithTurnstile = (props = {}) => {
    return render(
      <TurnstileProvider siteKey="test-key">
        <ContactFormWithPreClearance {...defaultProps} {...props} />
      </TurnstileProvider>
    );
  };

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderWithTurnstile();
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/betreff/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nachricht/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /senden/i })).toBeInTheDocument();
    });

    it('should render in English when isGerman is false', () => {
      renderWithTurnstile({ isGerman: false });
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should show required field indicators', () => {
      renderWithTurnstile();
      
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/e-mail/i);
      const phoneInput = screen.getByLabelText(/telefon/i);
      const subjectInput = screen.getByLabelText(/betreff/i);
      const messageTextarea = screen.getByLabelText(/nachricht/i);
      
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(phoneInput).not.toHaveAttribute('required'); // Phone is optional
      expect(subjectInput).toHaveAttribute('required');
      expect(messageTextarea).toHaveAttribute('required');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      const submitButton = screen.getByRole('button', { name: /senden/i });
      
      // Try to submit empty form
      await user.click(submitButton);
      
      // Should not call fetch if validation fails
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      const emailInput = screen.getByLabelText(/e-mail/i);
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      
      // Check HTML5 validation
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should validate phone number format', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      const phoneInput = screen.getByLabelText(/telefon/i);
      
      // Enter phone number with invalid characters
      await user.type(phoneInput, 'abc123');
      
      // The component should handle this in onChange
      expect(phoneInput).toHaveValue('+123'); // Letters filtered out
    });

    it('should validate message minimum length', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      const messageTextarea = screen.getByLabelText(/nachricht/i);
      
      // Enter short message
      await user.type(messageTextarea, 'Hi');
      
      // Should show character count
      expect(screen.getByText(/2 \/ 10/)).toBeInTheDocument();
    });
  });

  describe('Form Submission with Turnstile', () => {
    it('should get Turnstile token before submission', async () => {
      // Mock Turnstile to be ready and provide token
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options.callback('test-turnstile-token'), 10);
        return 'widget-id';
      });

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /senden/i });
      await user.click(submitButton);
      
      // Wait for Turnstile token to be obtained
      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalled();
      });
      
      // Wait for form submission
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('test-turnstile-token'),
          })
        );
      });
    });

    it('should handle Turnstile failure gracefully', async () => {
      // Mock Turnstile to fail
      mockTurnstile.render.mockImplementation((container, options) => {
        setTimeout(() => options['error-callback'](), 10);
        return 'widget-id';
      });

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /senden/i });
      await user.click(submitButton);
      
      // Should still submit but without token
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            body: expect.not.stringContaining('turnstileToken'),
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Mock slow response
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100))
      );

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /senden/i });
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText(/wird gesendet/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.queryByText(/wird gesendet/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Success and Error Handling', () => {
    it('should handle successful submission', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Wait for success
      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
      
      // Form should be reset
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/e-mail/i)).toHaveValue('');
    });

    it('should handle API errors', async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Wait for error
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Server error');
      });
      
      // Form should not be reset on error
      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Wait for error
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalled();
      });
    });

    it('should handle Turnstile-specific errors', async () => {
      // Mock Turnstile validation error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Captcha validation failed',
          error_codes: ['invalid-input-response'],
        }),
      });

      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Make Turnstile ready
      window.onloadTurnstileCallback?.();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Wait for error with specific message
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(
          expect.stringContaining('Sicherheitsüberprüfung')
        );
      });
    });
  });

  describe('Progressive Enhancement', () => {
    it('should work without Turnstile when not configured', async () => {
      // Render without Turnstile provider
      render(<ContactFormWithPreClearance {...defaultProps} />);
      const user = userEvent.setup();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Should submit without Turnstile token
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            body: expect.not.stringContaining('turnstileToken'),
          })
        );
      });
    });

    it('should show Turnstile error but allow submission', async () => {
      // Mock Turnstile error state
      const TurnstileContext = React.createContext({
        isReady: true,
        isLoading: false,
        error: { type: 'script', message: 'Failed to load script' },
        tokens: new Map(),
        analytics: {},
        getToken: vi.fn().mockRejectedValue(new Error('Turnstile error')),
        clearToken: vi.fn(),
        executeChallenge: vi.fn(),
        resetAnalytics: vi.fn(),
        preloadToken: vi.fn(),
      });

      render(
        <TurnstileContext.Provider value={TurnstileContext._currentValue as any}>
          <ContactFormWithPreClearance {...defaultProps} />
        </TurnstileContext.Provider>
      );
      
      const user = userEvent.setup();
      
      // Should show error message
      expect(screen.getByText(/sicherheitsüberprüfung/i)).toBeInTheDocument();
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/e-mail/i), 'john@example.com');
      await user.type(screen.getByLabelText(/betreff/i), 'Test Subject');
      await user.type(screen.getByLabelText(/nachricht/i), 'This is a test message');
      
      // Submit button should not be disabled
      const submitButton = screen.getByRole('button', { name: /senden/i });
      expect(submitButton).not.toBeDisabled();
      
      // Submit form
      await user.click(submitButton);
      
      // Should submit without token
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithTurnstile();
      
      expect(screen.getByRole('form')).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /senden/i })).toBeInTheDocument();
      
      // Check for fieldsets
      expect(screen.getByRole('group', { name: /persönliche/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /nachricht/i })).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Submit empty form to trigger validation
      await user.click(screen.getByRole('button', { name: /senden/i }));
      
      // Error messages should have proper ARIA
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('aria-invalid');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    it('should handle keyboard navigation', async () => {
      renderWithTurnstile();
      const user = userEvent.setup();
      
      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/e-mail/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/telefon/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/betreff/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/nachricht/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /senden/i })).toHaveFocus();
    });
  });
});