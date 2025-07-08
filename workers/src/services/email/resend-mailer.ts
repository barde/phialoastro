import { Resend } from 'resend';
import type { ContactFormData } from './types';
import { generateContactEmailTemplate, generateContactConfirmationTemplate } from './templates';

export interface ResendMailerConfig {
  resendApiKey: string;
  fromEmail?: string;
  fromName?: string;
  toEmail?: string;
}

/**
 * Send contact form emails using Resend API
 * This works properly with Cloudflare Workers
 */
export async function sendContactEmails(
  contactData: ContactFormData,
  config: ResendMailerConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(config.resendApiKey);
    
    const fromEmail = config.fromEmail || 'noreply@phialo.de';
    const fromName = config.fromName || 'Phialo Design';
    const toEmail = config.toEmail || 'info@phialo.de';

    // Generate email templates
    const notificationTemplate = generateContactEmailTemplate(contactData);
    const confirmationTemplate = generateContactConfirmationTemplate(contactData);

    // Send notification email to the business
    const notificationResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      replyTo: contactData.email,
      subject: notificationTemplate.subject,
      text: notificationTemplate.text,
      html: notificationTemplate.html,
    });

    if (notificationResult.error) {
      console.error('Failed to send notification email:', notificationResult.error);
      return { 
        success: false, 
        error: `Failed to send notification: ${notificationResult.error.message}` 
      };
    }

    // Send confirmation email to the customer
    const confirmationResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: contactData.email,
      subject: confirmationTemplate.subject,
      text: confirmationTemplate.text,
      html: confirmationTemplate.html,
    });

    if (confirmationResult.error) {
      console.error('Failed to send confirmation email:', confirmationResult.error);
      // Don't fail the whole operation if confirmation fails
      console.warn('Notification sent but confirmation failed');
    }

    console.log('Emails sent successfully', {
      notificationId: notificationResult.data?.id,
      confirmationId: confirmationResult.data?.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}