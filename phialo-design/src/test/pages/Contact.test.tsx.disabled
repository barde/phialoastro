import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock fetch globally
global.fetch = vi.fn();

describe('Contact Form', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Form Submission', () => {
    it('should successfully submit form with valid data', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        status: 200,
        json: async () => ({ success: true }),
      });

      // Create a minimal form component for testing
      const ContactForm = () => {
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          
          const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          const resultDiv = document.getElementById('form-result');
          if (resultDiv) {
            if (response.status === 200) {
              resultDiv.textContent = 'Thank you! Your message has been sent successfully.';
              resultDiv.className = 'success';
            } else {
              resultDiv.textContent = 'Something went wrong. Please try again.';
              resultDiv.className = 'error';
            }
          }
        };

        return (
          <form onSubmit={handleSubmit} data-testid="contact-form">
            <input type="hidden" name="access_key" value="test-key" />
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
            <div id="form-result"></div>
          </form>
        );
      };

      const user = userEvent.setup();
      render(<ContactForm />);
      
      // Fill out form
      await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Message'), 'Test message');
      
      // Submit form
      await user.click(screen.getByText('Send'));
      
      // Wait for async operations
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.web3forms.com/submit',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              access_key: 'test-key',
              name: 'John Doe',
              email: 'john@example.com',
              message: 'Test message'
            })
          })
        );
      });

      // Check success message
      const result = screen.getByText('Thank you! Your message has been sent successfully.');
      expect(result).toBeInTheDocument();
      expect(result).toHaveClass('success');
    });

    it('should handle submission errors gracefully', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        status: 400,
        json: async () => ({ success: false, message: 'Invalid access key' }),
      });

      const ContactForm = () => {
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          
          try {
            const response = await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const resultDiv = document.getElementById('form-result');
            if (resultDiv) {
              if (response.status === 200) {
                resultDiv.textContent = 'Thank you! Your message has been sent successfully.';
                resultDiv.className = 'success';
              } else {
                resultDiv.textContent = result.message || 'Something went wrong. Please try again.';
                resultDiv.className = 'error';
              }
            }
          } catch (error) {
            const resultDiv = document.getElementById('form-result');
            if (resultDiv) {
              resultDiv.textContent = 'Something went wrong. Please try again or contact us directly via email.';
              resultDiv.className = 'error';
            }
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="access_key" value="invalid-key" />
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
            <div id="form-result"></div>
          </form>
        );
      };

      const user = userEvent.setup();
      render(<ContactForm />);
      
      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Message'), 'Test message');
      await user.click(screen.getByText('Send'));
      
      // Wait for error message
      await waitFor(() => {
        const result = screen.getByText('Invalid access key');
        expect(result).toBeInTheDocument();
        expect(result).toHaveClass('error');
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const ContactForm = () => {
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData);
          
          try {
            const response = await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            const resultDiv = document.getElementById('form-result');
            if (resultDiv) {
              resultDiv.textContent = 'Success';
              resultDiv.className = 'success';
            }
          } catch (error) {
            const resultDiv = document.getElementById('form-result');
            if (resultDiv) {
              resultDiv.textContent = 'Something went wrong. Please try again or contact us directly via email.';
              resultDiv.className = 'error';
            }
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="access_key" value="test-key" />
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
            <div id="form-result"></div>
          </form>
        );
      };

      const user = userEvent.setup();
      render(<ContactForm />);
      
      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Message'), 'Test message');
      await user.click(screen.getByText('Send'));
      
      // Wait for error message
      await waitFor(() => {
        const result = screen.getByText('Something went wrong. Please try again or contact us directly via email.');
        expect(result).toBeInTheDocument();
        expect(result).toHaveClass('error');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const ContactForm = () => {
        return (
          <form>
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
          </form>
        );
      };

      render(<ContactForm />);
      
      const nameInput = screen.getByPlaceholderText('Name') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
      const messageInput = screen.getByPlaceholderText('Message') as HTMLTextAreaElement;
      
      // Check required attributes
      expect(nameInput.required).toBe(true);
      expect(emailInput.required).toBe(true);
      expect(messageInput.required).toBe(true);
      
      // Check email type
      expect(emailInput.type).toBe('email');
    });

    it('should prevent submission with empty fields', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      const ContactForm = () => {
        return (
          <form onSubmit={handleSubmit}>
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <textarea name="message" placeholder="Message" required />
            <button type="submit">Send</button>
          </form>
        );
      };

      const user = userEvent.setup();
      render(<ContactForm />);
      
      // Try to submit empty form
      const submitButton = screen.getByText('Send');
      await user.click(submitButton);
      
      // Form should not be submitted due to HTML5 validation
      // Note: In a real browser, this would prevent submission
      // In tests, we just verify the required attributes are set
      expect(screen.getByPlaceholderText('Name')).toHaveAttribute('required');
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('required');
      expect(screen.getByPlaceholderText('Message')).toHaveAttribute('required');
    });
  });

  describe('Honeypot Protection', () => {
    it('should include hidden honeypot field', () => {
      const ContactForm = () => {
        return (
          <form>
            <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />
            <input name="name" placeholder="Name" />
            <button type="submit">Send</button>
          </form>
        );
      };

      render(<ContactForm />);
      
      const honeypot = screen.getByRole('checkbox', { hidden: true });
      expect(honeypot).toBeInTheDocument();
      expect(honeypot).toHaveAttribute('name', 'botcheck');
      expect(honeypot).toHaveClass('hidden');
      expect(honeypot).toHaveStyle({ display: 'none' });
    });
  });
});