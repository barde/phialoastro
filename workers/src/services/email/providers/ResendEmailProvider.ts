import type { EmailProvider, EmailMessage, EmailResponse } from '../types';
import { logger } from '../../../utils/logger';

interface ResendConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
  enabled?: boolean;
  priority?: number;
}

interface ResendApiResponse {
  id?: string;
  error?: {
    message: string;
    name: string;
  };
}

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(config: ResendConfig) {
    if (!config.apiKey) {
      throw new Error('Resend API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail || 'onboarding@resend.dev';
    this.fromName = config.fromName || 'Phialo Design';
  }

  getName(): string {
    return 'Resend';
  }

  async isAvailable(): Promise<boolean> {
    // Always return true - availability will be determined by actual send attempts
    // This avoids blocking API calls before sending emails
    return true;
  }

  async send(email: EmailMessage): Promise<EmailResponse> {
    try {
      // Prepare Resend API payload
      const payload = {
        from: `${email.from.name || this.fromName} <${email.from.email || this.fromEmail}>`,
        to: email.to.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        subject: email.subject,
        text: email.text,
        html: email.html,
        // reply_to must be an array of email addresses (no names) in Resend API
        reply_to: email.replyTo ? 
          [email.replyTo.email] : 
          undefined,
        cc: email.cc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        bcc: email.bcc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        tags: email.tags?.length ? email.tags : undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof typeof payload] === undefined) {
          delete payload[key as keyof typeof payload];
        }
      });

      logger.info('Sending email via Resend', {
        to: email.to[0].email,
        subject: email.subject,
        hasReplyTo: !!payload.reply_to,
        replyToValue: payload.reply_to,
        payloadKeys: Object.keys(payload),
        payload: JSON.stringify(payload),
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json() as ResendApiResponse;

      if (!response.ok) {
        const errorMessage = result.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.error('Resend API error response', {
          status: response.status,
          error: result.error,
          payload: JSON.stringify(payload),
        });
        throw new Error(`Resend API error: ${errorMessage}`);
      }

      if (!result.id) {
        throw new Error('Resend API returned no message ID');
      }

      logger.info('Email sent successfully via Resend', {
        messageId: result.id,
      });

      return {
        success: true,
        messageId: result.id,
        provider: 'Resend',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send email via Resend', {
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        provider: 'Resend',
      };
    }
  }
}