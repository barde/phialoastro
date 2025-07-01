# Setting Up the Multi-Provider Email Service

This guide explains how to configure and use the new multi-provider email service for the Phialo Design contact form.

## Overview

The new email service architecture provides:
- **Multiple email providers** with automatic failover
- **Server-side email handling** for better security
- **Turnstile CAPTCHA** integration
- **Copy-to-sender** functionality
- **Multi-language support** (German/English)

## Architecture

```
Client (ContactForm.tsx)
    ↓ POST /api/contact
Worker API Handler
    ↓
Email Service (with failover)
    ├── Cloudflare Email Workers (Priority 1)
    ├── SendGrid (Priority 2)
    └── Google Workspace (Priority 3)
```

## Configuration

### 1. Environment Variables

Configure the following environment variables in your Worker:

#### Required Variables
```bash
# Email recipient
TO_EMAIL=info@phialo.de
FROM_EMAIL=noreply@phialo.de

# Turnstile (optional but recommended)
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

#### Provider-Specific Variables

**For Cloudflare Email Workers:**
```bash
# No additional config needed - uses Worker bindings
```

**For SendGrid:**
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@phialo.de  # Optional override
SENDGRID_FROM_NAME=Phialo Design       # Optional override
```

**For Google Workspace:**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

#### Optional Security Settings
```bash
# Domain restrictions (comma-separated)
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,phialo.de
BLOCKED_EMAIL_DOMAINS=tempmail.com,guerrillamail.com
```

### 2. Wrangler Configuration

#### For Local Development

Create a `.dev.vars` file:
```env
TO_EMAIL=test@example.com
FROM_EMAIL=noreply@phialo.de
SENDGRID_API_KEY=your_test_api_key
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

#### For Production

Use Wrangler to set secrets:
```bash
# Set SendGrid API key
wrangler secret put SENDGRID_API_KEY --env production

# Set Turnstile secret key
wrangler secret put TURNSTILE_SECRET_KEY --env production

# Set email configuration
wrangler secret put TO_EMAIL --env production
wrangler secret put FROM_EMAIL --env production
```

### 3. Email Binding Configuration

If using Cloudflare Email Workers, add to `wrangler.toml`:

```toml
[[send_email]]
name = "SEND_EMAIL"
# For production, specify destination
# destination_address = "info@phialo.de"
```

### 4. Frontend Configuration

Set the Turnstile site key in your Astro environment:

```env
# .env file
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

## Email Provider Setup

### Cloudflare Email Workers

1. Enable Email Routing for your domain in Cloudflare dashboard
2. Create email routing rules
3. The Worker will automatically use the `SEND_EMAIL` binding

### SendGrid

1. Create a SendGrid account
2. Generate an API key with `Mail Send` permission
3. Verify your sender domain
4. Set the `SENDGRID_API_KEY` environment variable

### Google Workspace (Not fully implemented)

1. Create a service account in Google Cloud Console
2. Enable domain-wide delegation
3. Grant Gmail API access
4. Set the `GOOGLE_SERVICE_ACCOUNT_KEY` with the JSON key

## Testing

### 1. Test Email Service Connection

```bash
# Test locally
curl -X GET http://localhost:8787/api/contact/test

# Response should show available providers:
{
  "cloudflare": true,
  "sendgrid": true,
  "google": false
}
```

### 2. Test Contact Form Submission

```bash
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "Test message content",
    "language": "en",
    "sendCopy": true,
    "turnstileToken": "test-token"
  }'
```

### 3. Test with Turnstile

Use these test keys for development:

- **Always passes**: `1x00000000000000000000AA`
- **Always blocks**: `2x00000000000000000000AB`
- **Always fails**: `3x00000000000000000000FF`

## Monitoring and Debugging

### Check Worker Logs

```bash
# Tail production logs
wrangler tail --env production

# Tail with filtering
wrangler tail --env production --search "email"
```

### Common Issues

1. **"No email providers were successfully initialized"**
   - Check that at least one provider is configured
   - Verify environment variables are set correctly

2. **"Captcha validation failed"**
   - Ensure Turnstile secret key matches the site key
   - Check if using test keys in production

3. **"Failed to send email with provider X"**
   - Check provider-specific configuration
   - Verify API keys and permissions
   - Check domain verification (SendGrid)

## Email Templates

The service generates two email templates:

1. **Notification Email** (to site owner)
   - Contains all form data
   - Includes metadata (IP, timestamp, etc.)
   - Formatted in HTML and plain text

2. **Confirmation Email** (to user)
   - Confirms message receipt
   - Includes copy of their message
   - Professional branded template

## Security Considerations

1. **API Keys**: Always use Wrangler secrets for sensitive data
2. **Rate Limiting**: Implement rate limiting in production
3. **Domain Restrictions**: Use `ALLOWED_EMAIL_DOMAINS` to prevent abuse
4. **CAPTCHA**: Always enable Turnstile in production
5. **CORS**: The API endpoint has CORS enabled for same-origin requests

## Migration from Web3Forms

The new system replaces the client-side Web3Forms integration with a more secure server-side approach:

1. **Before**: Client → Web3Forms API
2. **After**: Client → Worker API → Email Provider

Benefits:
- API keys are never exposed to clients
- Automatic failover between providers
- Better error handling and logging
- Additional features (copy-to-sender, Turnstile)

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure at least one email provider
- [ ] Set up Turnstile (site key + secret key)
- [ ] Test email sending in preview environment
- [ ] Verify email templates look correct
- [ ] Check error handling and fallback behavior
- [ ] Monitor initial production deployments