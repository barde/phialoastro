import { EmailMessage } from 'cloudflare:email';
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
			// Create a simple MIME message manually
			const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(36).substring(2)}`;
			const fromHeader = email.from.name ? `"${email.from.name}" <${email.from.email}>` : email.from.email;
			const toHeader = email.to.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
			
			// Build headers
			let headers = [
				`From: ${fromHeader}`,
				`To: ${toHeader}`,
				`Subject: ${email.subject}`,
				`Date: ${new Date().toUTCString()}`,
				`MIME-Version: 1.0`,
			];

			// Add CC if present
			if (email.cc && email.cc.length > 0) {
				const ccHeader = email.cc.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
				headers.push(`Cc: ${ccHeader}`);
			}

			// Add reply-to if present
			if (email.replyTo) {
				const replyToHeader = email.replyTo.name ? `"${email.replyTo.name}" <${email.replyTo.email}>` : email.replyTo.email;
				headers.push(`Reply-To: ${replyToHeader}`);
			}

			// Add custom headers
			if (email.headers) {
				for (const [key, value] of Object.entries(email.headers)) {
					headers.push(`${key}: ${value}`);
				}
			}

			// Build message body
			let body = '';
			
			if (email.text && email.html) {
				// Multipart message
				headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
				body = [
					'',
					`--${boundary}`,
					'Content-Type: text/plain; charset=utf-8',
					'Content-Transfer-Encoding: quoted-printable',
					'',
					email.text,
					`--${boundary}`,
					'Content-Type: text/html; charset=utf-8',
					'Content-Transfer-Encoding: quoted-printable',
					'',
					email.html,
					`--${boundary}--`,
				].join('\r\n');
			} else if (email.html) {
				headers.push('Content-Type: text/html; charset=utf-8');
				headers.push('Content-Transfer-Encoding: quoted-printable');
				body = '\r\n' + email.html;
			} else if (email.text) {
				headers.push('Content-Type: text/plain; charset=utf-8');
				headers.push('Content-Transfer-Encoding: quoted-printable');
				body = '\r\n' + email.text;
			}

			// Combine headers and body
			const rawMessage = headers.join('\r\n') + '\r\n' + body;

			// Create EmailMessage instance
			const message = new EmailMessage(
				email.from.email,
				email.to[0].email, // Primary recipient
				rawMessage
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