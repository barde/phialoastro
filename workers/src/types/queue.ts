/**
 * Email queue message types
 */

import { ContactFormData } from '../services/email/types';

/**
 * Base queue message structure
 */
export interface QueueMessage<T = any> {
  id: string;
  timestamp: string;
  retryCount?: number;
  data: T;
}

/**
 * Email queue message types
 */
export enum EmailQueueMessageType {
  CONTACT_FORM = 'contact-form',
  CONTACT_CONFIRMATION = 'contact-confirmation',
}

/**
 * Contact form email message
 */
export interface ContactFormEmailMessage extends QueueMessage<ContactFormData> {
  type: EmailQueueMessageType.CONTACT_FORM;
}

/**
 * Union type for all email queue messages
 */
export type EmailQueueMessage = ContactFormEmailMessage;

/**
 * Queue batch for email processing
 */
export interface EmailQueueBatch extends MessageBatch<EmailQueueMessage> {}