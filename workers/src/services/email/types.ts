export interface EmailProvider {
	send(email: EmailMessage): Promise<EmailResponse>;
	isAvailable(): Promise<boolean>;
	getName(): string;
}

export interface EmailMessage {
	from: EmailAddress;
	to: EmailAddress[];
	cc?: EmailAddress[];
	bcc?: EmailAddress[];
	replyTo?: EmailAddress;
	subject: string;
	text?: string;
	html?: string;
	attachments?: EmailAttachment[];
	headers?: Record<string, string>;
	tags?: string[];
	metadata?: Record<string, any>;
}

export interface EmailAddress {
	email: string;
	name?: string;
}

export interface EmailAttachment {
	filename: string;
	content: string;
	contentType?: string;
	encoding?: 'base64' | 'binary';
	cid?: string;
}

export interface EmailResponse {
	success: boolean;
	messageId?: string;
	provider: string;
	error?: string;
	details?: any;
}

export interface EmailServiceConfig {
	providers: {
		resend?: {
			enabled: boolean;
			priority: number;
			apiKey: string;
			fromEmail?: string;
			fromName?: string;
		};
		sendgrid?: {
			enabled: boolean;
			priority: number;
			apiKey: string;
			fromEmail?: string;
			fromName?: string;
		};
		google?: {
			enabled: boolean;
			priority: number;
			serviceAccountKey: string;
			delegatedEmail?: string;
		};
	};
	fallbackEnabled: boolean;
	maxRetries: number;
	retryDelay: number;
	rateLimit?: {
		maxPerMinute: number;
		maxPerHour: number;
		maxPerDay: number;
	};
	allowedDomains?: string[];
	blockedDomains?: string[];
}

export interface ContactFormData {
	name: string;
	email: string;
	phone?: string;
	subject: string;
	message: string;
	language: 'de' | 'en';
	metadata?: {
		userAgent?: string;
		ipAddress?: string;
		timestamp?: string;
		referrer?: string;
	};
}

export interface TurnstileValidationResult {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	error_codes?: string[];
	action?: string;
	cdata?: string;
}