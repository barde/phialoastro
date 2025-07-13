import { ExecutionContext } from '@cloudflare/workers-types';
import { WorkerEnv } from '../../types/worker';
import { EmailQueueMessage, EmailQueueMessageType } from '../../types/queue';
import { EmailService } from '../../services/email/EmailService';
import { generateContactEmailTemplate, generateContactConfirmationTemplate } from '../../services/email/templates';
import { EmailServiceConfig } from '../../services/email/types';
import { logger } from '../../utils/logger';

/**
 * Process email queue messages
 */
export async function handleEmailQueue(
  batch: MessageBatch<EmailQueueMessage>,
  env: WorkerEnv,
  ctx: ExecutionContext
): Promise<void> {
  logger.info(`Processing email queue batch`, {
    messageCount: batch.messages.length,
    queue: batch.queue,
  });

  // Initialize email service once for the batch
  const emailService = createEmailService(env);
  if (!emailService) {
    logger.error('Failed to initialize email service, retrying all messages');
    batch.retryAll();
    return;
  }

  // Process each message
  for (const message of batch.messages) {
    try {
      logger.info('Processing email message', {
        messageId: message.id,
        type: message.body.type,
        timestamp: message.body.timestamp,
        retryCount: message.body.retryCount || 0,
      });

      await processEmailMessage(message.body, emailService, env);
      
      // Acknowledge successful processing
      message.ack();
      logger.info('Successfully processed email message', {
        messageId: message.id,
        type: message.body.type,
      });
    } catch (error) {
      logger.error('Failed to process email message', {
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Retry the message
      message.retry();
    }
  }
}

/**
 * Process individual email message based on type
 */
async function processEmailMessage(
  message: EmailQueueMessage,
  emailService: EmailService,
  env: WorkerEnv
): Promise<void> {
  switch (message.type) {
    case EmailQueueMessageType.CONTACT_FORM:
      await sendContactFormEmails(message.data, emailService, env);
      break;
    default:
      throw new Error(`Unknown email message type: ${(message as any).type}`);
  }
}

/**
 * Send contact form emails (main + confirmation)
 */
async function sendContactFormEmails(
  contactData: EmailQueueMessage['data'],
  emailService: EmailService,
  env: WorkerEnv
): Promise<void> {
  // Generate email templates
  const mainEmailTemplate = generateContactEmailTemplate(contactData);

  // Send main notification email
  logger.info('Sending main contact form email', {
    to: env.TO_EMAIL || 'info@phialo.de',
    subject: mainEmailTemplate.subject,
  });

  const mainEmailResponse = await emailService.send({
    from: {
      email: env.FROM_EMAIL || 'noreply@phialo.de',
      name: 'Phialo Website',
    },
    to: [{
      email: env.TO_EMAIL || 'info@phialo.de',
      name: 'Phialo Design',
    }],
    replyTo: {
      email: contactData.email,
      name: contactData.name,
    },
    subject: mainEmailTemplate.subject,
    html: mainEmailTemplate.html,
    text: mainEmailTemplate.text,
    tags: ['contact-form', contactData.language],
    metadata: {
      formId: 'contact',
      language: contactData.language,
      timestamp: contactData.metadata?.timestamp,
    },
  });

  if (!mainEmailResponse.success) {
    throw new Error(`Failed to send main email: ${mainEmailResponse.error}`);
  }

  logger.info('Main contact form email sent successfully', {
    messageId: mainEmailResponse.messageId,
  });

  // Send confirmation email to user (optional, don't fail if this fails)
  try {
    const confirmationTemplate = generateContactConfirmationTemplate(contactData);
    
    logger.info('Sending confirmation email to user', {
      to: contactData.email,
      subject: confirmationTemplate.subject,
    });

    const confirmationResponse = await emailService.send({
      from: {
        email: env.FROM_EMAIL || 'noreply@phialo.de',
        name: 'Phialo Design',
      },
      to: [{
        email: contactData.email,
        name: contactData.name,
      }],
      subject: confirmationTemplate.subject,
      html: confirmationTemplate.html,
      text: confirmationTemplate.text,
      tags: ['contact-form-confirmation', contactData.language],
      metadata: {
        formId: 'contact-confirmation',
        language: contactData.language,
        timestamp: contactData.metadata?.timestamp,
      },
    });

    if (confirmationResponse.success) {
      logger.info('Confirmation email sent successfully', {
        messageId: confirmationResponse.messageId,
      });
    } else {
      logger.warn('Failed to send confirmation email', {
        error: confirmationResponse.error,
      });
    }
  } catch (error) {
    // Don't fail the main email if confirmation fails
    logger.error('Failed to send confirmation email', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Create email service instance
 */
function createEmailService(env: WorkerEnv): EmailService | null {
  try {
    // Configure email service - Resend only
    const emailConfig: EmailServiceConfig = {
      providers: {
        resend: {
          enabled: !!env.RESEND_API_KEY,
          priority: 1,
          apiKey: env.RESEND_API_KEY || '',
          fromEmail: env.FROM_EMAIL || 'onboarding@resend.dev',
          fromName: 'Phialo Design',
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
      fallbackEnabled: false, // No fallback needed with single provider
      maxRetries: 0, // Let the queue handle retries
      retryDelay: 0,
      allowedDomains: env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
      blockedDomains: env.BLOCKED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
    };

    return new EmailService(emailConfig, env);
  } catch (error) {
    logger.error('Failed to create email service', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}