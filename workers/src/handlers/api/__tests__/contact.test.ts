import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContactForm } from '../contact';
import { EmailService } from '../../../services/email/EmailService';

// Mock dependencies
vi.mock('../../../services/email/EmailService');
vi.mock('../../../services/turnstile/TurnstileService', () => {
  const mockValidate = vi.fn().mockResolvedValue({ success: true });
  const mockTurnstileInstance = {
    validate: mockValidate,
  };

  const MockTurnstileService = vi.fn().mockImplementation(() => mockTurnstileInstance);
  MockTurnstileService.fromEnv = vi.fn().mockReturnValue(mockTurnstileInstance);

  return {
    TurnstileService: MockTurnstileService,
  };
});

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
  let mockEmailService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEmailService = {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        provider: 'Resend',
      }),
    };
    
    vi.mocked(EmailService).mockImplementation(() => mockEmailService);
    
    mockEnv = {
      RESEND_API_KEY: 'test-key',
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

    it('should send email and return success', async () => {
      mockRequest.json.mockResolvedValue(validFormData);
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Your message has been sent successfully.');
      expect(body.messageId).toBe('test-message-id');
      
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.objectContaining({
            email: 'noreply@test.com',
          }),
          to: expect.arrayContaining([
            expect.objectContaining({
              email: 'admin@test.com',
            }),
          ]),
          subject: 'New Contact Request: Test Subject',
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
      
      expect(body.message).toBe('Ihre Nachricht wurde erfolgreich gesendet.');
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
      
      expect(mockEmailService.send).toHaveBeenCalled();
    });
  });

  describe('email failures', () => {
    it('should return error when email send fails', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      });
      
      mockEmailService.send.mockResolvedValue({
        success: false,
        error: 'Email send failed',
      });
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to send message. Please try again later.');
    });
  });

  describe('Turnstile validation', () => {
    let TurnstileService: any;
    
    beforeEach(async () => {
      vi.clearAllMocks();
      // Get the mocked module
      const module = await import('../../../services/turnstile/TurnstileService');
      TurnstileService = module.TurnstileService;
    });

    it('should validate Turnstile token when configured', async () => {
      // Configure the mock to return success
      const mockInstance = new TurnstileService();
      mockInstance.validate.mockResolvedValue({ success: true });
      TurnstileService.mockImplementation(() => mockInstance);
      TurnstileService.fromEnv.mockReturnValue(mockInstance);
      
      mockEnv.TURNSTILE_SECRET_KEY = 'test-secret';
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        turnstileToken: 'test-token',
      });
      
      // Add the request URL for the handler
      mockRequest.url = 'http://localhost:3000/api/contact';
      
      const response = await handleContactForm(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      expect(mockInstance.validate).toHaveBeenCalledWith(
        'test-token', 
        '127.0.0.1',
        expect.objectContaining({
          hostname: 'localhost',
        })
      );
    });

    it('should reject when Turnstile validation fails', async () => {
      // Configure the mock to return failure
      const mockInstance = new TurnstileService();
      mockInstance.validate.mockResolvedValue({ 
        success: false, 
        error_codes: ['invalid-input-response'] 
      });
      TurnstileService.mockImplementation(() => mockInstance);
      TurnstileService.fromEnv.mockReturnValue(mockInstance);
      
      mockEnv.TURNSTILE_SECRET_KEY = 'test-secret';
      mockRequest.json.mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
        turnstileToken: 'invalid-token',
      });
      
      // Add the request URL for the handler
      mockRequest.url = 'http://localhost:3000/api/contact';
      
      const response = await handleContactForm(mockRequest, mockEnv);
      const body = await response.json();
      
      expect(response.status).toBe(400);
      expect(body.error).toBe('Captcha validation failed');
      expect(body.error_codes).toEqual(['invalid-input-response']);
    });
  });
});