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