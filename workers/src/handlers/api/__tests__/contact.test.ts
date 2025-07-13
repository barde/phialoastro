import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContactForm } from '../contact';
import { EmailQueueMessageType } from '../../../types/queue';

// Mock dependencies
vi.mock('../../../services/turnstile/TurnstileService', () => ({
  TurnstileService: vi.fn().mockImplementation(() => ({
    validate: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('handleContactForm', () => {
  let mockRequest: any;
  let mockEnv: any;
  let mockQueueSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockQueueSend = vi.fn().mockResolvedValue(undefined);
    
    mockEnv = {
      EMAIL_QUEUE: {
        send: mockQueueSend,
      },
      FROM_EMAIL: 'noreply@test.com',
      TO_EMAIL: 'admin@test.com',
      ENVIRONMENT: 'test',
    };

    mockRequest = {
      method: 'POST',
      headers: {
        get: vi.fn((key) => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'CF-Connecting-IP': '127.0.0.1',
          };
          return headers[key] || null;
        }),
      },
      json: vi.fn(),
    };
  });

  describe('request validation', () => {
    it('should reject non-POST requests', async () => {
      mockRequest.method = 'GET';
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(405);
      expect(body.error).toBe('Method not allowed');
    });

    it('should reject invalid JSON', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid JSON body');
    });

    it('should reject missing required fields', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        // missing email, subject, message
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Missing required fields');
      expect(body.fields).toEqual(['email', 'subject', 'message']);
    });

    it('should reject invalid email format', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Test message',
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid email address');
    });
  });

  describe('successful submission', () => {
    const validFormData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test message content',
      language: 'en',
    };

    it('should queue email and return success', async () => {
      mockRequest.json.mockResolvedValue(validFormData);
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(202);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Your message has been received and will be processed shortly.');
      
      expect(mockQueueSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EmailQueueMessageType.CONTACT_FORM,
          data: expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Subject',
            message: 'Test message content',
            language: 'en',
          }),
        })
      );
    });

    it('should return German message for German language', async () => {
      mockRequest.json.mockResolvedValue({
        ...validFormData,
        language: 'de',
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(body.message).toBe('Ihre Nachricht wurde erfolgreich empfangen und wird in Kürze bearbeitet.');
    });

    it('should include metadata in queued message', async () => {
      mockRequest.json.mockResolvedValue(validFormData);
      mockRequest.headers.get.mockImplementation((key) => {
        const headers: Record<string, string> = {
          'User-Agent': 'Test Browser',
          'CF-Connecting-IP': '192.168.1.1',
          'Referer': 'https://example.com',
        };
        return headers[key] || null;
      });
      
      await handleContactForm(mockRequest, mockEnv);
      
      expect(mockQueueSend).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              userAgent: 'Test Browser',
              ipAddress: '192.168.1.1',
              referrer: 'https://example.com',
              timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            }),
          }),
        })
      );
    });
  });

  describe('queue failures', () => {
    it('should return error when queue send fails', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });
      
      mockQueueSend.mockRejectedValue(new Error('Queue error'));
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to process your message. Please try again later.');
    });
  });

  describe('Turnstile validation', () => {
    it('should validate Turnstile token when configured', async () => {
      const TurnstileService = vi.mocked(await import('../../../services/turnstile/TurnstileService')).TurnstileService;
      const mockValidate = vi.fn().mockResolvedValue({ success: true });
      
      TurnstileService.mockImplementation(() => ({
        validate: mockValidate,
      }) as any);
      
      mockEnv.TURNSTILE_SECRET_KEY = 'test-secret';
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        turnstileToken: 'test-token',
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      
      expect(response.status).toBe(202);
      expect(mockValidate).toHaveBeenCalledWith('test-token', '127.0.0.1');
    });

    it('should reject when Turnstile validation fails', async () => {
      const TurnstileService = vi.mocked(await import('../../../services/turnstile/TurnstileService')).TurnstileService;
      const mockValidate = vi.fn().mockResolvedValue({ 
        success: false, 
        error_codes: ['invalid-input-response'] 
      });
      
      TurnstileService.mockImplementation(() => ({
        validate: mockValidate,
      }) as any);
      
      mockEnv.TURNSTILE_SECRET_KEY = 'test-secret';
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        turnstileToken: 'invalid-token',
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Captcha validation failed');
      expect(body.error_codes).toEqual(['invalid-input-response']);
    });
  });
});