import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendEmailProvider } from '../providers/ResendEmailProvider';
import { EmailMessage } from '../types';

// Mock fetch
global.fetch = vi.fn();

describe('ResendEmailProvider', () => {
  let provider: ResendEmailProvider;
  const mockConfig = {
    apiKey: 'test-api-key',
    fromEmail: 'test@example.com',
    fromName: 'Test Sender',
    enabled: true,
    priority: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ResendEmailProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(() => new ResendEmailProvider(mockConfig)).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      expect(() => new ResendEmailProvider({ ...mockConfig, apiKey: '' })).toThrow(
        'Resend API key is required'
      );
    });

    it('should use default values when not provided', () => {
      const minimalConfig = { apiKey: 'test-key' };
      const minimalProvider = new ResendEmailProvider(minimalConfig);
      expect(minimalProvider.getName()).toBe('Resend');
    });
  });

  describe('isAvailable', () => {
    it('should always return true (non-blocking)', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('send', () => {
    const testEmail: EmailMessage = {
      from: { email: 'sender@example.com', name: 'Sender' },
      to: [{ email: 'recipient@example.com', name: 'Recipient' }],
      subject: 'Test Email',
      html: '<p>Test content</p>',
      text: 'Test content',
    };

    it('should send email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'test-message-id' }),
        status: 200,
        statusText: 'OK',
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const response = await provider.send(testEmail);

      expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"subject":"Test Email"'),
      });

      expect(response).toEqual({
        success: true,
        messageId: 'test-message-id',
        provider: 'Resend',
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' },
        }),
        status: 401,
        statusText: 'Unauthorized',
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const response = await provider.send(testEmail);

      expect(response).toEqual({
        success: false,
        error: 'Resend API error: Invalid API key',
        provider: 'Resend',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const response = await provider.send(testEmail);

      expect(response).toEqual({
        success: false,
        error: 'Network error',
        provider: 'Resend',
      });
    });

    it('should format email with reply-to', async () => {
      const emailWithReplyTo = {
        ...testEmail,
        replyTo: { email: 'reply@example.com', name: 'Reply Person' },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'test-message-id' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await provider.send(emailWithReplyTo);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.reply_to).toBe('Reply Person <reply@example.com>');
    });

    it('should include tags when provided', async () => {
      const emailWithTags = {
        ...testEmail,
        tags: ['contact-form', 'urgent'],
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'test-message-id' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await provider.send(emailWithTags);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.tags).toEqual(['contact-form', 'urgent']);
    });
  });
});