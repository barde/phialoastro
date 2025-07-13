// Test email sending locally
import dotenv from 'dotenv';
import { ResendEmailProvider } from './src/services/email/providers/ResendEmailProvider.js';

// Load environment variables from .dev.vars
dotenv.config({ path: '.dev.vars' });

async function testEmail() {
  console.log('Testing email with Resend...');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  
  const provider = new ResendEmailProvider({
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    fromName: 'Phialo Design Test'
  });

  try {
    const result = await provider.send({
      from: {
        email: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        name: 'Phialo Design Test'
      },
      to: [{
        email: 'test@example.com',
        name: 'Test User'
      }],
      subject: 'Test Email from Local Environment',
      text: 'This is a test email from the local environment.',
      html: '<p>This is a test email from the local environment.</p>'
    });

    console.log('Email result:', result);
  } catch (error) {
    console.error('Email error:', error);
  }
}

testEmail();