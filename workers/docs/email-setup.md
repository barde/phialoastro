# Email Setup Guide

This project uses [worker-mailer](https://github.com/zou-yu/worker-mailer) with Google SMTP for sending emails from Cloudflare Workers.

## Prerequisites

1. A Google Workspace account (paid Google Apps for Business)
2. 2-factor authentication enabled on the Google account
3. An app-specific password for SMTP access

## Setup Instructions

### 1. Generate Google App Password

1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Generate a new app-specific password
4. Save the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 2. Configure Cloudflare Workers Secrets

Set the following secrets for each environment:

```bash
# Development environment
npx wrangler secret put GMAIL_ADDRESS
npx wrangler secret put GMAIL_APP_PASSWORD

# Preview environment
npx wrangler secret put GMAIL_ADDRESS --env preview
npx wrangler secret put GMAIL_APP_PASSWORD --env preview

# Production environment
npx wrangler secret put GMAIL_ADDRESS --env production
npx wrangler secret put GMAIL_APP_PASSWORD --env production
```

### 3. Optional Configuration

You can also set these optional environment variables in `wrangler.toml`:

```toml
[vars]
FROM_EMAIL = "noreply@phialo.de"  # Override sender email
FROM_NAME = "Phialo Design"        # Sender display name
TO_EMAIL = "info@phialo.de"        # Contact form recipient
```

## Testing

Use the test script to verify your email configuration:

```bash
# Test with specific email addresses
./scripts/test-email.sh recipient@example.com

# Test with multiple recipients
./scripts/test-email.sh test@example.com admin@example.com
```

## Architecture

The email system consists of:

- `src/services/email/mailer.ts` - Main email service using worker-mailer
- `src/services/email/templates.ts` - Email templates (HTML/text) with i18n support
- `src/services/email/types.ts` - TypeScript interfaces
- `src/handlers/api/contact.ts` - Contact form handler that sends emails

## Troubleshooting

### Common Issues

1. **Authentication failed**: Ensure you're using an app-specific password, not your regular Google password
2. **Invalid credentials**: Check that 2FA is enabled on your Google account
3. **Rate limiting**: Google SMTP has sending limits based on your account type
4. **Connection timeout**: Cloudflare Workers have a 30-second timeout for SMTP connections

### Debug Mode

Enable debug logging by modifying the LogLevel in `mailer.ts`:

```typescript
logLevel: LogLevel.DEBUG
```