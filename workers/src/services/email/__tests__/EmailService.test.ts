import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../EmailService';
import { EmailServiceConfig, EmailMessage } from '../types';
import { ResendEmailProvider } from '../providers/ResendEmailProvider';

// Mock the providers
vi.mock('../providers/ResendEmailProvider');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockConfig: EmailServiceConfig;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = {
      providers: {
        resend: {
          enabled: true,
          priority: 1,
          apiKey: 'test-api-key',
          fromEmail: 'test@example.com',
          fromName: 'Test Sender',
        },
        sendgrid: {
          enabled: false,
          priority: 2,
          apiKey: '',
          fromEmail: '',
          fromName: '',
        },
        google: {
          enabled: false,
          priority: 3,
          serviceAccountKey: '',
          delegatedEmail: undefined,
        },
      },
      fallbackEnabled: false,
      maxRetries: 1,
      retryDelay: 0,
    };

    mockEnv = {
      RESEND_API_KEY: 'test-api-key',
      FROM_EMAIL: 'test@example.com',
      TO_EMAIL: 'recipient@example.com',
    };
  });

  describe('constructor', () => {
    it('should initialize with enabled providers', () => {
      vi.mocked(ResendEmailProvider).mockImplementation(() => ({
        getName: () => 'Resend',
        isAvailable: () => Promise.resolve(true),
        send: vi.fn(),
      }) as any);
      
      expect(() => new EmailService(mockConfig, mockEnv)).not.toThrow();
    });

    it('should throw error when no providers are configured', () => {
      mockConfig.providers.resend.enabled = false;
      expect(() => new EmailService(mockConfig, mockEnv)).toThrow(
        'Resend is not configured. Please set RESEND_API_KEY.'
      );
    });
  });

  describe('send', () => {
    let testEmail: EmailMessage;

    beforeEach(() => {
      testEmail = {
        from: { email: 'sender@example.com', name: 'Sender' },
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };
    });

    it('should send email successfully', async () => {
      // Set up the mock before creating the service
      vi.mocked(ResendEmailProvider).mockImplementation(() => ({
        getName: () => 'Resend',
        isAvailable: () => Promise.resolve(true),
        send: vi.fn().mockResolvedValue({
          success: true,
          messageId: 'test-message-id',
          provider: 'Resend',
        }),
      }) as any);

      emailService = new EmailService(mockConfig, mockEnv);
      const response = await emailService.send(testEmail);

      expect(response).toEqual({
        success: true,
        messageId: 'test-message-id',
        provider: 'Resend',
      });
    });

    it('should validate email before sending', async () => {
      vi.mocked(ResendEmailProvider).mockImplementation(() => ({
        getName: () => 'Resend',
        isAvailable: () => Promise.resolve(true),
        send: vi.fn(),
      }) as any);
      
      emailService = new EmailService(mockConfig, mockEnv);
      
      const invalidEmail = {
        ...testEmail,
        to: [], // Empty recipients
      };

      await expect(emailService.send(invalidEmail)).rejects.toThrow(
        'Email must have at least one recipient'
      );
    });

    it('should handle send failures', async () => {
      vi.mocked(ResendEmailProvider).mockImplementation(() => ({
        getName: () => 'Resend',
        isAvailable: () => Promise.resolve(true),
        send: vi.fn().mockResolvedValue({
          success: false,
          error: 'API Error',
          provider: 'Resend',
        }),
      }) as any);

      emailService = new EmailService(mockConfig, mockEnv);

      await expect(emailService.send(testEmail)).rejects.toThrow(
        'Failed to send email after 1 attempts. Last error: API Error'
      );
    });

    it('should apply domain restrictions', async () => {
      vi.mocked(ResendEmailProvider).mockImplementation(() => ({
        getName: () => 'Resend',
        isAvailable: () => Promise.resolve(true),
        send: vi.fn(),
      }) as any);
      
      mockConfig.blockedDomains = ['blocked.com'];
      emailService = new EmailService(mockConfig, mockEnv);

      const blockedEmail = {
        ...testEmail,
        to: [{ email: 'user@blocked.com' }],
      };

      await expect(emailService.send(blockedEmail)).rejects.toThrow(
        'Domain blocked.com is blocked'
      );
    });
  });
});