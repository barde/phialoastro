import { AutoRouter } from 'itty-router';
import { TurnstileService } from './services/turnstile/TurnstileService';
import { sendContactEmails, type ResendMailerConfig } from './services/email/resend-mailer';
import type { ContactFormData } from './services/email/types';

// Types
interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  TO_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

// Create router - AutoRouter automatically returns JSON responses
const router = AutoRouter();

// Test endpoint (non-production only)
router.get('/api/test-email', (request, env: Env) => {
  // Only allow in non-production
  if (env.ENVIRONMENT === 'production') {
    return new Response(JSON.stringify({ error: 'Test endpoint not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasCredentials = !!env.RESEND_API_KEY;
  
  return {
    success: true,
    environment: env.ENVIRONMENT || 'unknown',
    credentialsConfigured: hasCredentials,
    fromEmail: env.FROM_EMAIL || 'noreply@phialo.de',
    toEmail: env.TO_EMAIL || 'info@phialo.de',
    message: hasCredentials 
      ? 'Email credentials are configured. Use POST /api/contact to send emails.'
      : 'Email credentials are NOT configured. Set RESEND_API_KEY secret.',
  };
});

// Contact form endpoint
router.post('/api/contact', async (request, env: Env) => {
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        fields: missingFields,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Turnstile token if enabled
    if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
      const turnstileService = new TurnstileService(env.TURNSTILE_SECRET_KEY);
      const turnstileResult = await turnstileService.validate(
        body.turnstileToken,
        request.headers.get('CF-Connecting-IP') || undefined
      );

      if (!turnstileResult.success) {
        console.warn('Turnstile validation failed', {
          error_codes: turnstileResult.error_codes,
        });
        
        return new Response(JSON.stringify({ 
          error: 'Captcha validation failed',
          error_codes: turnstileResult.error_codes,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Prepare contact form data
    const contactData: ContactFormData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim(),
      subject: body.subject.trim(),
      message: body.message.trim(),
      language: body.language || 'de',
      metadata: {
        userAgent: request.headers.get('User-Agent') || undefined,
        ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
        timestamp: new Date().toISOString(),
        referrer: request.headers.get('Referer') || undefined,
      },
    };

    // Check if Resend API key is configured
    if (!env.RESEND_API_KEY) {
      console.error('Resend API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Email service not configured. Please contact administrator.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Configure mailer
    const mailerConfig: ResendMailerConfig = {
      resendApiKey: env.RESEND_API_KEY,
      fromEmail: env.FROM_EMAIL,
      fromName: env.FROM_NAME,
      toEmail: env.TO_EMAIL,
    };

    // Send emails using worker-mailer
    console.log('Sending contact form emails...', {
      from: contactData.email,
      to: mailerConfig.toEmail || 'info@phialo.de',
      subject: contactData.subject,
    });

    const emailResult = await sendContactEmails(contactData, mailerConfig);

    if (!emailResult.success) {
      console.error('Failed to send emails:', emailResult.error);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email. Please try again later.',
        details: emailResult.error,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return success response
    return {
      success: true,
      message: contactData.language === 'de' 
        ? 'Vielen Dank für Ihre Nachricht. Wir werden uns in Kürze bei Ihnen melden.'
        : 'Thank you for your message. We will get back to you soon.',
    };

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred. Please try again later.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Handle static assets for all other requests
router.all('*', async (request, env: Env) => {
  try {
    // Forward to asset handler
    return await env.ASSETS.fetch(request);
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
});

// Export the router directly - itty-router v5 handles the fetch interface
export default router;