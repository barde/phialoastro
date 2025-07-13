import { WorkerEnv } from './types/worker';
import { EmailService } from './services/email/EmailService';
import { generateContactEmailTemplate, generateContactConfirmationTemplate } from './services/email/templates';
import type { ContactFormData, EmailServiceConfig } from './services/email/types';

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      
      // Handle health check
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          hasResendKey: !!env.RESEND_API_KEY,
          hasFromEmail: !!env.FROM_EMAIL,
          hasToEmail: !!env.TO_EMAIL,
          environment: env.ENVIRONMENT || 'unknown',
          fromEmail: env.FROM_EMAIL || 'not-set',
          toEmail: env.TO_EMAIL || 'not-set',
        }, 200);
      }
      
      // Handle test email endpoint
      if (url.pathname === '/api/test-email' && request.method === 'POST') {
        return handleTestEmail(request, env);
      }
      
      // Handle contact form API
      if (url.pathname === '/api/contact' && request.method === 'POST') {
        return handleContactForm(request, env);
      }
      
      // Serve static assets for all other requests
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          message: error.message 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

async function handleContactForm(request: Request, env: WorkerEnv): Promise<Response> {
  console.log('handleContactForm called');
  
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
      console.log('Received body:', body);
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    // Validate Turnstile token if enabled
    if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
      const { validateTurnstileToken } = await import('./utils/turnstile');
      const remoteIP = request.headers.get('CF-Connecting-IP') || undefined;
      
      const turnstileResult = await validateTurnstileToken(
        body.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        remoteIP
      );

      if (!turnstileResult.success) {
        return jsonResponse({
          error: 'Security verification failed',
          errorCodes: turnstileResult.error_codes,
        }, 400);
      }
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return jsonResponse({ 
        error: 'Missing required fields',
        fields: missingFields,
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400);
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

    // Configure email service - Resend only
    console.log('Configuring email service with:', {
      hasResendKey: !!env.RESEND_API_KEY,
      fromEmail: env.FROM_EMAIL || 'onboarding@resend.dev',
      toEmail: env.TO_EMAIL || 'info@phialo.de',
    });
    
    const emailConfig: EmailServiceConfig = {
      providers: {
        resend: {
          enabled: !!env.RESEND_API_KEY,
          priority: 1,
          apiKey: env.RESEND_API_KEY || '',
          fromEmail: env.FROM_EMAIL || 'onboarding@resend.dev',
          fromName: 'Phialo Design',
        },
      },
      fallbackEnabled: false,
      maxRetries: 3,
      retryDelay: 1000,
    };

    // Initialize email service
    let emailService: EmailService;
    try {
      console.log('Initializing email service...');
      emailService = new EmailService(emailConfig, env);
      console.log('Email service initialized');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return jsonResponse({ 
        error: 'Email service is not configured. Please set RESEND_API_KEY.',
        details: env.ENVIRONMENT === 'development' ? error.message : undefined,
      }, 503);
    }

    // Generate email template
    const mainEmailTemplate = generateContactEmailTemplate(contactData);

    // Send main notification email
    console.log('Sending main email...');
    // Use FROM_EMAIL if it's set, otherwise fallback to onboarding@resend.dev
    const fromEmail = env.FROM_EMAIL || 'onboarding@resend.dev';
    const mainEmailResponse = await emailService.send({
      from: {
        email: fromEmail,
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
    });

    if (!mainEmailResponse.success) {
      console.error('Failed to send main email:', mainEmailResponse.error);
      return jsonResponse({ 
        error: 'Failed to send message. Please try again later.',
      }, 500);
    }

    console.log('Main email sent successfully');

    // Send confirmation email to user (optional)
    if (body.sendCopy !== false) {
      try {
        const confirmationTemplate = generateContactConfirmationTemplate(contactData);
        
        await emailService.send({
          from: {
            email: fromEmail,
            name: 'Phialo Design',
          },
          to: [{
            email: contactData.email,
            name: contactData.name,
          }],
          subject: confirmationTemplate.subject,
          html: confirmationTemplate.html,
          text: confirmationTemplate.text,
        });

        console.log('Confirmation email sent to user');
      } catch (error) {
        // Don't fail the request if confirmation email fails
        console.error('Failed to send confirmation email:', error);
      }
    }

    // Return success response
    return jsonResponse({
      success: true,
      message: contactData.language === 'de' 
        ? 'Ihre Nachricht wurde erfolgreich gesendet.'
        : 'Your message has been sent successfully.',
      messageId: mainEmailResponse.messageId,
    }, 200);

  } catch (error) {
    console.error('Unexpected error in contact form handler:', error);
    return jsonResponse({ 
      error: 'An unexpected error occurred. Please try again later.',
      details: error.message,
    }, 500);
  }
}

async function handleTestEmail(request: Request, env: WorkerEnv): Promise<Response> {
  try {
    console.log('Test email endpoint called');
    
    // Send a minimal test email directly to Resend API
    const payload = {
      from: env.FROM_EMAIL || 'onboarding@resend.dev',
      to: env.TO_EMAIL || 'info@phialo.de',
      subject: 'Test Email from Worker',
      text: 'This is a test email sent directly to Resend API.',
      html: '<p>This is a test email sent directly to Resend API.</p>',
    };
    
    console.log('Sending test email with payload:', JSON.stringify(payload));
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json() as any;
    console.log('Resend API response:', response.status, JSON.stringify(result));
    
    if (!response.ok) {
      return jsonResponse({
        error: 'Resend API error',
        status: response.status,
        details: result,
        payload: payload,
      }, response.status);
    }
    
    return jsonResponse({
      success: true,
      messageId: result.id,
      details: result,
    }, 200);
    
  } catch (error) {
    console.error('Test email error:', error);
    return jsonResponse({
      error: 'Test email failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}