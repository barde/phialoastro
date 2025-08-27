import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import ContactForm from '../../../features/contact/components/ContactForm';

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: 'http://localhost:4321/'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock fetch for Web3Forms API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('ContactForm', () => {
  beforeEach(() => {
    // Reset location to German
    mockLocation.pathname = '/';
    // Reset fetch mock
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('Validation', () => {
    it('shows required field errors when submitting empty form', async () => {
      render(<ContactForm />);
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name ist erforderlich')).toBeInTheDocument();
        expect(screen.getByText('E-Mail ist erforderlich')).toBeInTheDocument();
        expect(screen.getByText('Nachricht ist erforderlich')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<ContactForm />);
      
      const emailInput = screen.getByLabelText(/E-Mail/);
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText('Bitte geben Sie eine gültige E-Mail-Adresse ein')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      render(<ContactForm />);
      
      const phoneInput = screen.getByLabelText(/Telefon/);
      await userEvent.type(phoneInput, 'abc123');
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText('Bitte geben Sie eine gültige Telefonnummer ein')).toBeInTheDocument();
      });
    });

    it('validates message length', async () => {
      render(<ContactForm />);
      
      const messageInput = screen.getByLabelText(/Nachricht/);
      await userEvent.type(messageInput, 'Short');
      fireEvent.blur(messageInput);
      
      await waitFor(() => {
        expect(screen.getByText('Die Nachricht sollte mindestens 10 Zeichen lang sein')).toBeInTheDocument();
      });
    });

    it('clears errors when user corrects input', async () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/Name/);
      
      // First trigger an error
      fireEvent.blur(nameInput);
      await waitFor(() => {
        expect(screen.getByText('Name ist erforderlich')).toBeInTheDocument();
      });
      
      // Then fix it
      await userEvent.type(nameInput, 'John Doe');
      
      await waitFor(() => {
        expect(screen.queryByText('Name ist erforderlich')).not.toBeInTheDocument();
      });
    });
  });

  describe('Language Support', () => {
    it('renders German content by default', () => {
      render(<ContactForm />);
      
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ihr Name')).toBeInTheDocument();
      expect(screen.getByText('Nachricht senden')).toBeInTheDocument();
    });

    it('renders English content for /en/ path', async () => {
      mockLocation.pathname = '/en/contact';
      
      render(<ContactForm />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
        expect(screen.getByText('Send Message')).toBeInTheDocument();
      });
    });

    it('shows English validation errors on English pages', async () => {
      mockLocation.pathname = '/en/contact';
      
      render(<ContactForm />);
      
      await waitFor(() => {
        const submitButton = screen.getByText('Send Message');
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('disables form during submission', async () => {
      render(<ContactForm />);
      
      // Fill in valid data
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Wird gesendet...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows success message after submission', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      render(<ContactForm />);
      
      // Fill in valid data
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Erfolg!')).toBeInTheDocument();
        expect(screen.getByText(/Ihre Nachricht wurde erfolgreich gesendet/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('resets form after successful submission', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      render(<ContactForm />);
      
      // Fill in valid data
      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/E-Mail/);
      const messageInput = screen.getByLabelText(/Nachricht/);
      
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(messageInput, 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Erfolg!')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Close success modal
      const closeButton = screen.getByText('Schließen');
      fireEvent.click(closeButton);
      
      // Check form is reset
      expect((nameInput as HTMLInputElement).value).toBe('');
      expect((emailInput as HTMLInputElement).value).toBe('');
      expect((messageInput as HTMLTextAreaElement).value).toBe('');
    });

    it('calls onSuccess callback when provided', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      const onSuccess = vi.fn();
      render(<ContactForm onSuccess={onSuccess} />);
      
      // Fill in valid data
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('shows error modal on submission failure', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock failed API response
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<ContactForm />);
      
      // Fill in valid data
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fehler')).toBeInTheDocument();
      });
      
      // Restore
      consoleSpy.mockRestore();
    });

    it('allows retry after error', async () => {
      // Mock successful API response for the second attempt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      render(<ContactForm />);
      
      // Trigger validation error first
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name ist erforderlich')).toBeInTheDocument();
      });
      
      // Fill form correctly
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      // Submit again
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Erfolg!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows invalid access key error when API rejects with invalid key message', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock API response with invalid access key error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false,
          message: 'Invalid access key' 
        })
      });
      
      render(<ContactForm />);
      
      // Fill in valid data
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fehler')).toBeInTheDocument();
        expect(screen.getByText('Konfigurationsfehler: Ungültiger Access Key')).toBeInTheDocument();
      });
      
      // Restore
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and descriptions', () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/Name/);
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
      expect(nameInput).toHaveAttribute('required');
      
      const emailInput = screen.getByLabelText(/E-Mail/);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('announces validation errors with ARIA', async () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/Name/);
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Name ist erforderlich');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      });
    });

    it('form has noValidate to use custom validation', () => {
      const { container } = render(<ContactForm />);
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });
  });

  describe('Form Persistence', () => {
    it('saves form data to localStorage when user types', async () => {
      render(<ContactForm />);
      
      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/E-Mail/);
      const messageInput = screen.getByLabelText(/Nachricht/);
      
      // Type in the fields
      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(messageInput, 'Test message');
      
      // Wait for debounced save
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'phialo-contact-form',
          expect.stringContaining('John Doe')
        );
      });
      
      // Verify the saved data structure
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        message: 'Test message'
      });
    });

    it('restores form data from localStorage on mount', async () => {
      const savedData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+49 123 456789',
        message: 'Saved message content'
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));
      
      render(<ContactForm />);
      
      // Wait for the form to be populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+49 123 456789')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Saved message content')).toBeInTheDocument();
      });
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('phialo-contact-form');
    });

    it('clears persisted data after successful submission', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      render(<ContactForm />);
      
      // Fill the form
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      // Submit the form
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Erfolg!')).toBeInTheDocument();
      });
      
      // Verify localStorage was cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('phialo-contact-form');
    });

    it('preserves form data when submission fails', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock failed API response
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<ContactForm />);
      
      // Fill the form
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      await userEvent.type(screen.getByLabelText(/E-Mail/), 'john@example.com');
      await userEvent.type(screen.getByLabelText(/Nachricht/), 'This is a test message');
      
      // Submit the form
      const submitButton = screen.getByText('Nachricht senden');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fehler')).toBeInTheDocument();
      });
      
      // Verify localStorage was NOT cleared
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      
      // Verify form data is still present
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is a test message')).toBeInTheDocument();
      
      // Restore
      consoleSpy.mockRestore();
    });

    it('handles localStorage errors gracefully', async () => {
      // Mock console.warn to check for warnings
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Make localStorage.setItem throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      
      render(<ContactForm />);
      
      // Type in a field
      await userEvent.type(screen.getByLabelText(/Name/), 'John Doe');
      
      // Wait for the warning
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to persist form data:',
          expect.any(Error)
        );
      });
      
      // Form should still work normally
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      
      // Restore
      consoleSpy.mockRestore();
    });
  });
});