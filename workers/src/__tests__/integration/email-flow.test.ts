import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleEmailQueue } from '../../handlers/queue/email';
import { EmailQueueMessageType } from '../../types/queue';
import type { WorkerEnv } from '../../types/worker';

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {} as any;
}
(global.crypto as any).randomUUID = () => 'test-uuid-' + Date.now();

describe('Email Flow Integration', () => {
  let mockEnv: WorkerEnv;
  let mockBatch: any;
  let mockCtx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEnv = {
      ASSETS: {} as any,
      EMAIL_QUEUE: {} as any,
      RESEND_API_KEY: 'test-resend-key',
      FROM_EMAIL: 'noreply@test.com',
      TO_EMAIL: 'admin@test.com',
      ENVIRONMENT: 'test',
    };

    mockCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };

    mockBatch = {
      queue: 'email-queue',
      messages: [],
      retryAll: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Queue Processing', () => {
    it('should process contact form messages successfully', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          id: 'test-id',
          type: EmailQueueMessageType.CONTACT_FORM,
          timestamp: new Date().toISOString(),
          retryCount: 0,
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Test Contact',
            message: 'This is a test message',
            language: 'en',
            metadata: {
              timestamp: new Date().toISOString(),
            },
          },
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      // Mock successful Resend API response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'resend-msg-id' }),
        status: 200,
      });

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      // Verify main email was sent
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-resend-key',
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"subject":"New Contact Request: Test Contact"'),
        })
      );

      // Verify confirmation email was sent
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Verify message was acknowledged
      expect(mockMessage.ack).toHaveBeenCalled();
      expect(mockMessage.retry).not.toHaveBeenCalled();
    });

    it('should retry messages on send failure', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          id: 'test-id',
          type: EmailQueueMessageType.CONTACT_FORM,
          timestamp: new Date().toISOString(),
          data: {
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Test',
            message: 'Test message',
            language: 'en',
            metadata: {},
          },
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      // Mock failed Resend API response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          error: { message: 'Invalid API key' } 
        }),
        status: 401,
      });

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      expect(mockMessage.retry).toHaveBeenCalled();
      expect(mockMessage.ack).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          id: 'test-id',
          type: EmailQueueMessageType.CONTACT_FORM,
          timestamp: new Date().toISOString(),
          data: {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test',
            message: 'Test',
            language: 'en',
            metadata: {},
          },
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      // Mock network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      expect(mockMessage.retry).toHaveBeenCalled();
      expect(mockMessage.ack).not.toHaveBeenCalled();
    });

    it('should retry all messages when email service initialization fails', async () => {
      // Remove required API key
      mockEnv.RESEND_API_KEY = undefined;

      mockBatch.messages = [{
        id: 'msg-1',
        body: {
          type: EmailQueueMessageType.CONTACT_FORM,
          data: {},
        },
      }];

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      expect(mockBatch.retryAll).toHaveBeenCalled();
    });
  });

  describe('Email Content', () => {
    it('should send emails with correct content for German language', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          type: EmailQueueMessageType.CONTACT_FORM,
          timestamp: new Date().toISOString(),
          data: {
            name: 'Hans Müller',
            email: 'hans@example.de',
            phone: '+49 123 456789',
            subject: 'Anfrage zu Custom Schmuck',
            message: 'Ich interessiere mich für Ihre Dienstleistungen',
            language: 'de',
            metadata: {
              timestamp: new Date().toISOString(),
            },
          },
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-id' }),
      });

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      // Check main email
      const mainEmailCall = (global.fetch as any).mock.calls[0];
      const mainEmailBody = JSON.parse(mainEmailCall[1].body);
      
      expect(mainEmailBody.subject).toBe('Neue Kontaktanfrage: Anfrage zu Custom Schmuck');
      expect(mainEmailBody.html).toContain('Neue Kontaktanfrage');
      expect(mainEmailBody.html).toContain('Hans Müller');
      
      // Check confirmation email
      const confirmationCall = (global.fetch as any).mock.calls[1];
      const confirmationBody = JSON.parse(confirmationCall[1].body);
      
      expect(confirmationBody.subject).toBe('Ihre Nachricht wurde empfangen - Phialo Design');
      expect(confirmationBody.to[0]).toBe('Hans Müller <hans@example.de>');
    });

    it('should include metadata in emails', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          type: EmailQueueMessageType.CONTACT_FORM,
          timestamp: new Date().toISOString(),
          data: {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test',
            message: 'Test message',
            language: 'en',
            metadata: {
              userAgent: 'Mozilla/5.0',
              ipAddress: '192.168.1.1',
              timestamp: '2025-01-01T12:00:00Z',
              referrer: 'https://example.com/contact',
            },
          },
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-id' }),
      });

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      const mainEmailCall = (global.fetch as any).mock.calls[0];
      const mainEmailBody = JSON.parse(mainEmailCall[1].body);
      
      expect(mainEmailBody.html).toContain('192.168.1.1');
      expect(mainEmailBody.html).toContain('Mozilla/5.0');
      expect(mainEmailBody.html).toContain('https://example.com/contact');
    });
  });

  describe('Error Handling', () => {
    it('should continue processing other messages when one fails', async () => {
      const messages = [
        {
          id: 'msg-1',
          body: {
            type: EmailQueueMessageType.CONTACT_FORM,
            data: {
              name: 'User 1',
              email: 'user1@example.com',
              subject: 'Test 1',
              message: 'Message 1',
              language: 'en',
              metadata: {},
            },
          },
          ack: vi.fn(),
          retry: vi.fn(),
        },
        {
          id: 'msg-2',
          body: {
            type: EmailQueueMessageType.CONTACT_FORM,
            data: {
              name: 'User 2',
              email: 'user2@example.com',
              subject: 'Test 2',
              message: 'Message 2',
              language: 'en',
              metadata: {},
            },
          },
          ack: vi.fn(),
          retry: vi.fn(),
        },
      ];

      mockBatch.messages = messages;

      // First call fails, second succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'Error' } }),
          status: 500,
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ id: 'msg-id' }),
        });

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      expect(messages[0].retry).toHaveBeenCalled();
      expect(messages[0].ack).not.toHaveBeenCalled();
      expect(messages[1].ack).toHaveBeenCalled();
      expect(messages[1].retry).not.toHaveBeenCalled();
    });

    it('should handle unknown message types', async () => {
      const mockMessage = {
        id: 'msg-1',
        body: {
          type: 'unknown-type',
          data: {},
        },
        ack: vi.fn(),
        retry: vi.fn(),
      };

      mockBatch.messages = [mockMessage];

      await handleEmailQueue(mockBatch, mockEnv, mockCtx);

      expect(mockMessage.retry).toHaveBeenCalled();
      expect(mockMessage.ack).not.toHaveBeenCalled();
    });
  });
});