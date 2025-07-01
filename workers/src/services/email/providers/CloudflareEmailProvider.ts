import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import type { EmailProvider, EmailMessage as IEmailMessage, EmailResponse } from '../types';
import { logger } from '../../../utils/logger';

export class CloudflareEmailProvider implements EmailProvider {
	private env: any;
	private config: any;

	constructor(env: any, config: any) {
		this.env = env;
		this.config = config;
	}

	getName(): string {
		return 'Cloudflare Email Workers';
	}

	async isAvailable(): Promise<boolean> {
		// Check if email binding exists
		return !!(this.env.SEND_EMAIL || this.env.EMAIL);
	}

	async send(email: IEmailMessage): Promise<EmailResponse> {
		try {
			// Create MIME message
			const msg = createMimeMessage();
			
			// Set sender
			msg.setSender({
				name: email.from.name || '',
				addr: email.from.email,
			});

			// Set recipients
			for (const recipient of email.to) {
				msg.setRecipient(recipient.email);
			}

			// Set CC recipients
			if (email.cc && email.cc.length > 0) {
				for (const cc of email.cc) {
					msg.setCc(cc.email);
				}
			}

			// Set subject
			msg.setSubject(email.subject);

			// Set reply-to if provided
			if (email.replyTo) {
				msg.setHeader('Reply-To', email.replyTo.email);
			}

			// Add custom headers
			if (email.headers) {
				for (const [key, value] of Object.entries(email.headers)) {
					msg.setHeader(key, value);
				}
			}

			// Add content
			if (email.html) {
				msg.addMessage({
					contentType: 'text/html',
					data: email.html,
				});
			}

			if (email.text) {
				msg.addMessage({
					contentType: 'text/plain',
					data: email.text,
				});
			}

			// Create EmailMessage instance
			const message = new EmailMessage(
				email.from.email,
				email.to[0].email, // Primary recipient
				msg.asRaw()
			);

			// Send via appropriate binding
			const emailBinding = this.env.SEND_EMAIL || this.env.EMAIL;
			await emailBinding.send(message);

			// Generate a message ID
			const messageId = `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			logger.info('Email sent via Cloudflare Email Workers', { messageId });

			return {
				success: true,
				messageId,
				provider: this.getName(),
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.error('Failed to send email via Cloudflare', { error: errorMessage });

			return {
				success: false,
				provider: this.getName(),
				error: errorMessage,
			};
		}
	}
}