import type { EmailProvider, EmailMessage, EmailResponse } from '../types';
import { logger } from '../../../utils/logger';

interface GoogleConfig {
	enabled: boolean;
	priority: number;
	serviceAccountKey: string;
	delegatedEmail?: string;
}

interface ServiceAccountKey {
	type: string;
	project_id: string;
	private_key_id: string;
	private_key: string;
	client_email: string;
	client_id: string;
	auth_uri: string;
	token_uri: string;
	auth_provider_x509_cert_url: string;
	client_x509_cert_url: string;
}

export class GoogleWorkspaceEmailProvider implements EmailProvider {
	private config: GoogleConfig;
	private serviceAccount: ServiceAccountKey;

	constructor(config: GoogleConfig) {
		this.config = config;
		if (!this.config.serviceAccountKey) {
			throw new Error('Google service account key is required');
		}
		
		try {
			// Parse the service account key
			this.serviceAccount = JSON.parse(this.config.serviceAccountKey);
		} catch (error) {
			throw new Error('Invalid service account key JSON');
		}
	}

	getName(): string {
		return 'Google Workspace';
	}

	async isAvailable(): Promise<boolean> {
		// Check if we have the required configuration
		return !!(this.serviceAccount && this.config.delegatedEmail);
	}

	async send(email: EmailMessage): Promise<EmailResponse> {
		try {
			// Get access token using JWT
			const accessToken = await this.getAccessToken();
			
			// Create the email message in RFC 2822 format
			const rawMessage = this.createRawMessage(email);
			
			// Send email via Gmail API
			const response = await this.sendViaGmailAPI(rawMessage, accessToken);
			
			return {
				success: true,
				messageId: response.id,
				provider: this.getName(),
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.error('Failed to send email via Google Workspace', { error: errorMessage });

			return {
				success: false,
				provider: this.getName(),
				error: errorMessage,
			};
		}
	}

	private async getAccessToken(): Promise<string> {
		try {
			// Create JWT
			const jwt = await this.createJWT();
			
			// Exchange JWT for access token
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					assertion: jwt,
				}),
			});

			if (!tokenResponse.ok) {
				const error = await tokenResponse.text();
				throw new Error(`Token exchange failed: ${error}`);
			}

			const tokenData = await tokenResponse.json() as { access_token: string };
			return tokenData.access_token;
		} catch (error) {
			logger.error('Failed to get access token', { error });
			throw error;
		}
	}

	private async createJWT(): Promise<string> {
		const header = {
			alg: 'RS256',
			typ: 'JWT',
		};

		const now = Math.floor(Date.now() / 1000);
		const claims = {
			iss: this.serviceAccount.client_email,
			sub: this.config.delegatedEmail, // The email to impersonate
			scope: 'https://www.googleapis.com/auth/gmail.send',
			aud: 'https://oauth2.googleapis.com/token',
			exp: now + 3600, // 1 hour
			iat: now,
		};

		// Encode header and claims
		const encodedHeader = this.base64urlEncode(JSON.stringify(header));
		const encodedClaims = this.base64urlEncode(JSON.stringify(claims));
		const unsignedJWT = `${encodedHeader}.${encodedClaims}`;

		// Sign the JWT
		// Note: In a Cloudflare Worker environment, you'll need to use the Web Crypto API
		// This is a simplified version - in production, use proper crypto libraries
		const signature = await this.signJWT(unsignedJWT, this.serviceAccount.private_key);
		
		return `${unsignedJWT}.${signature}`;
	}

	private async signJWT(data: string, privateKey: string): Promise<string> {
		// Import the private key
		const pemContents = privateKey
			.replace(/-----BEGIN PRIVATE KEY-----/, '')
			.replace(/-----END PRIVATE KEY-----/, '')
			.replace(/\s/g, '');
		
		const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
		
		const cryptoKey = await crypto.subtle.importKey(
			'pkcs8',
			binaryKey,
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256',
			},
			false,
			['sign']
		);

		// Sign the data
		const encoder = new TextEncoder();
		const signature = await crypto.subtle.sign(
			'RSASSA-PKCS1-v1_5',
			cryptoKey,
			encoder.encode(data)
		);

		// Convert to base64url
		return this.base64urlEncode(signature);
	}

	private createRawMessage(email: EmailMessage): string {
		const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(36)}`;
		const headers: string[] = [
			`From: ${email.from.name ? `"${email.from.name}" <${email.from.email}>` : email.from.email}`,
			`To: ${email.to.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ')}`,
			`Subject: ${email.subject}`,
			`Date: ${new Date().toUTCString()}`,
			`Message-ID: <${Date.now()}.${Math.random().toString(36)}@${email.from.email.split('@')[1]}>`,
			`MIME-Version: 1.0`,
		];

		// Add CC if present
		if (email.cc && email.cc.length > 0) {
			headers.push(`Cc: ${email.cc.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ')}`);
		}

		// Add Reply-To if present
		if (email.replyTo) {
			headers.push(`Reply-To: ${email.replyTo.name ? `"${email.replyTo.name}" <${email.replyTo.email}>` : email.replyTo.email}`);
		}

		// Handle multipart message
		if (email.text && email.html) {
			headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
			
			const body = [
				'',
				`--${boundary}`,
				'Content-Type: text/plain; charset=utf-8',
				'Content-Transfer-Encoding: base64',
				'',
				this.base64Encode(email.text),
				`--${boundary}`,
				'Content-Type: text/html; charset=utf-8',
				'Content-Transfer-Encoding: base64',
				'',
				this.base64Encode(email.html),
				`--${boundary}--`,
			];
			
			return headers.join('\r\n') + '\r\n' + body.join('\r\n');
		} else if (email.html) {
			headers.push('Content-Type: text/html; charset=utf-8');
			headers.push('Content-Transfer-Encoding: base64');
			return headers.join('\r\n') + '\r\n\r\n' + this.base64Encode(email.html);
		} else {
			headers.push('Content-Type: text/plain; charset=utf-8');
			headers.push('Content-Transfer-Encoding: base64');
			return headers.join('\r\n') + '\r\n\r\n' + this.base64Encode(email.text || '');
		}
	}

	private async sendViaGmailAPI(rawMessage: string, accessToken: string): Promise<{ id: string }> {
		const encodedMessage = this.base64urlEncode(rawMessage);
		
		const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				raw: encodedMessage,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Gmail API error: ${error}`);
		}

		return await response.json() as { id: string };
	}

	private base64Encode(str: string): string {
		return btoa(unescape(encodeURIComponent(str)));
	}

	private base64urlEncode(data: string | ArrayBuffer): string {
		let base64: string;
		
		if (typeof data === 'string') {
			base64 = btoa(unescape(encodeURIComponent(data)));
		} else {
			const bytes = new Uint8Array(data);
			let binary = '';
			for (let i = 0; i < bytes.byteLength; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			base64 = btoa(binary);
		}
		
		return base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	}
}