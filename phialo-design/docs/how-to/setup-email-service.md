# Email Service Setup Guide

This guide walks you through setting up email providers for the Phialo Design contact form. The system supports multiple providers with automatic failover:

1. **SendGrid** (Primary - Recommended for its free tier)
2. **Google Workspace Gmail API** (Fallback - Requires paid Google Workspace account)

## Quick Start (SendGrid Only)

For most users, SendGrid alone is sufficient. Here's the fastest setup:

1. **Sign up** at [signup.sendgrid.com](https://signup.sendgrid.com/)
2. **Create API Key**: Settings → API Keys → Create API Key → Full Access
3. **Add to Cloudflare**:
   ```bash
   wrangler secret put SENDGRID_API_KEY
   # Paste your key: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Deploy** and you're done!

That's it! For detailed instructions or to add Google Workspace as a fallback, continue reading.

## Overview

### Why SendGrid as Primary?

- **Free Tier**: 100 emails/day (3,000/month) - perfect for < 1,000 emails/month
- **Simple Setup**: Just an API key, no complex OAuth configuration
- **High Deliverability**: Industry-leading email delivery rates
- **Developer Friendly**: Excellent API and documentation
- **No Domain Requirements**: Works without Google Workspace

### Provider Comparison

| Feature | SendGrid (Primary) | Google Workspace (Fallback) |
|---------|-------------------|----------------------------|
| Free Tier | 100/day (3,000/month) | No free tier |
| Setup Complexity | Simple (API key only) | Complex (OAuth + delegation) |
| Required Account | Free SendGrid account | Paid Google Workspace |
| Best For | Transactional emails | Complex integrations |
| Deliverability | Excellent | Good |

---

## Option 1: SendGrid Setup (Recommended)

### Prerequisites

- Email address for account creation
- Domain access for sender verification (optional but recommended)

### Step 1: Create SendGrid Account

1. Go to **[SendGrid Signup](https://signup.sendgrid.com/)**
2. Fill in the registration form:
   - Use a business email (not Gmail/Yahoo)
   - Select "Transactional Email" as use case
   - Choose "Website" as the sending method
3. Verify your email address
4. Complete the account setup wizard

### Step 2: Generate API Key

1. Log into **[SendGrid Dashboard](https://app.sendgrid.com/)**
2. Navigate to **Settings → API Keys**
3. Click "Create API Key"
4. Choose "Full Access" (or "Restricted Access" with Mail Send permissions)
5. Name it (e.g., "phialo-website")
6. **Copy and save the API key** - you won't see it again!

### Step 3: Verify Sender (Recommended)

1. Go to **Settings → Sender Authentication**
2. Choose one of:
   - **Single Sender Verification** (easier):
     - Click "Verify a Single Sender"
     - Enter `noreply@phialo.de` as the sender
     - Complete verification via email
   - **Domain Authentication** (better deliverability):
     - Click "Authenticate Your Domain"
     - Follow DNS setup instructions

### Step 4: Configure Environment Variables

#### For Local Development

Create or update `workers/.dev.vars`:

```bash
# SendGrid configuration (Primary Provider)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email settings
FROM_EMAIL=noreply@phialo.de
TO_EMAIL=info@phialo.de

# Optional: Turnstile for spam protection
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

#### For Production (Cloudflare Workers)

```bash
# Add SendGrid API key as secret
wrangler secret put SENDGRID_API_KEY
# Paste your SendGrid API key when prompted

# Add other secrets if needed
wrangler secret put TURNSTILE_SECRET_KEY
```

### Step 5: Test SendGrid Setup

You can test your SendGrid setup with this curl command:

```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "test@example.com"}]
    }],
    "from": {"email": "noreply@phialo.de"},
    "subject": "Test Email",
    "content": [{
      "type": "text/plain",
      "value": "This is a test email from SendGrid."
    }]
  }'
```

---

## Option 2: Google Workspace Setup (Fallback)

### Prerequisites

- Google Workspace account with Super Admin privileges
- Access to Google Cloud Console
- Your domain (e.g., phialo.de) verified in Google Workspace

## Official Google Documentation Links

### Primary Resources
- **[Domain-wide Delegation Setup Guide](https://support.google.com/a/answer/162106)** - Official Google Workspace Admin documentation
- **[Gmail API Documentation](https://developers.google.com/gmail/api/guides)** - Complete Gmail API reference
- **[Create Service Account Credentials](https://developers.google.com/workspace/guides/create-credentials#service-account)** - Official guide for service accounts
- **[Domain-wide Delegation Best Practices](https://support.google.com/a/answer/14437356)** - Security recommendations

### API References
- **[Gmail API - Send Method](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send)** - API endpoint documentation
- **[Gmail API Quotas](https://developers.google.com/gmail/api/reference/quota)** - Usage limits and quotas
- **[OAuth 2.0 for Service Accounts](https://developers.google.com/identity/protocols/oauth2/service-account)** - Authentication flow

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "phialo-email-service")
4. Click "Create"

### Step 2: Enable Gmail API

1. In Google Cloud Console, go to **[APIs & Services → Library](https://console.cloud.google.com/apis/library)**
2. Search for "Gmail API"
3. Click on **[Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)**
4. Click "Enable"

### Step 3: Create Service Account

1. Go to **[IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**
2. Click "Create Service Account"
3. Fill in:
   - Service account name: `phialo-email-sender`
   - Service account ID: (auto-generated)
   - Description: `Service account for sending emails via Gmail API`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### Step 4: Create Service Account Key

1. Click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. **Save the downloaded JSON file securely** - you'll need this later

### Step 5: Get Client ID for Domain-wide Delegation

1. Still in the service account details page
2. Click "Show Advanced Settings" or look for "Unique ID"
3. Copy the **Client ID** (a long numeric string)
4. You'll need this for the next step

### Step 6: Configure Domain-wide Delegation

1. Go to **[Google Admin Console](https://admin.google.com/)**
2. Navigate to **Security → Access and data control → [API controls](https://admin.google.com/ac/owl/domainwidedelegation)**
3. Click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Enter:
   - **Client ID**: The numeric ID from Step 5
   - **OAuth Scopes**: Add these scopes (one per line):
     ```
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.compose
     https://www.googleapis.com/auth/gmail.modify
     ```
6. Click "Authorize"

**Note**: Changes can take up to 24 hours to propagate, but usually happen within minutes.

### Step 7: Configure Environment Variables

#### For Local Development

Create or update `workers/.dev.vars`:

```bash
# Google Workspace Email configuration
GOOGLE_SERVICE_ACCOUNT_KEY=<paste entire JSON content from Step 4>
GOOGLE_DELEGATED_EMAIL=noreply@phialo.de

# Email settings
FROM_EMAIL=noreply@phialo.de
TO_EMAIL=info@phialo.de
```

### Step 7: Update Google Workspace Configuration

Since Google Workspace is now the fallback provider, update the configuration:

```bash
# workers/.dev.vars (for local development)
# SendGrid (Primary)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Workspace (Fallback) - Optional
GOOGLE_SERVICE_ACCOUNT_KEY=<paste entire JSON content>
GOOGLE_DELEGATED_EMAIL=noreply@phialo.de

# Common settings
FROM_EMAIL=noreply@phialo.de
TO_EMAIL=info@phialo.de
```

#### For Production (Cloudflare Workers)

Use wrangler to set secrets:

```bash
# Set the service account key
wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
# When prompted, paste the entire JSON content

# Set the delegated email
wrangler secret put GOOGLE_DELEGATED_EMAIL
# Enter: noreply@phialo.de

# Set other email variables
wrangler secret put FROM_EMAIL
# Enter: noreply@phialo.de

wrangler secret put TO_EMAIL
# Enter: info@phialo.de
```

### Step 8: Test Your Configuration

1. Start the worker locally:
   ```bash
   cd workers
   npm run dev
   ```

2. Run the test script:
   ```bash
   ./test-google-email.sh
   ```

3. Check for success response with a message ID

## Troubleshooting

### Common Issues and Solutions

#### "Token exchange failed" Error
- **Cause**: Invalid service account key or delegation not configured
- **Solution**: 
  - Verify JSON is valid in `.dev.vars`
  - Check delegation is authorized in Google Admin
  - Ensure `GOOGLE_DELEGATED_EMAIL` is a real user in your workspace

#### "Unauthorized" or 403 Errors
- **Cause**: Scopes not properly authorized
- **Solution**:
  - Verify Client ID matches in Google Admin
  - Check all three scopes are added
  - Wait up to 24 hours for propagation
  - Ensure the delegated email has a Gmail license

#### "Gmail API not enabled" Error
- **Cause**: API not enabled in Cloud Console
- **Solution**: Follow Step 2 to enable Gmail API

### Useful Debugging Tools

- **[Google API Explorer](https://developers.google.com/apis-explorer/#p/gmail/v1/)** - Test API calls
- **[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)** - Test authentication
- **[Cloud Console Logs](https://console.cloud.google.com/logs)** - View API request logs

## Security Best Practices

1. **Service Account Key Management**:
   - Never commit keys to version control
   - Rotate keys every 90 days
   - Use Cloudflare secrets for production

2. **Scope Minimization**:
   - Only grant required scopes
   - Remove unused service accounts
   - Regular audit of delegations

3. **Monitoring**:
   - Set up [quota alerts](https://console.cloud.google.com/apis/api/gmail.googleapis.com/quotas)
   - Monitor [API usage](https://console.cloud.google.com/apis/api/gmail.googleapis.com/metrics)
   - Enable [audit logs](https://support.google.com/a/answer/4579696)

## Additional Resources

### Video Tutorials
- **[Google Workspace Service Accounts](https://www.youtube.com/watch?v=OWaEuuBdW0o)** - Official Google Cloud video
- **[Domain-wide Delegation Tutorial](https://www.youtube.com/watch?v=qkXyumUlFHg)** - Step-by-step walkthrough

### Community Resources
- **[Stack Overflow - Gmail API Tag](https://stackoverflow.com/questions/tagged/gmail-api)**
- **[Google Workspace Developers Community](https://developers.google.com/community/experts)**

### Support
- **[Google Cloud Support](https://cloud.google.com/support)** - For API issues
- **[Google Workspace Support](https://support.google.com/a/)** - For admin console issues

## Quick Reference

### Required Information Checklist
- [ ] Google Cloud Project ID
- [ ] Service Account Email (e.g., `phialo-email@project.iam.gserviceaccount.com`)
- [ ] Service Account Key JSON file
- [ ] Client ID for delegation
- [ ] Delegated email address (e.g., `noreply@phialo.de`)

### API Endpoints Used
- Token Exchange: `https://oauth2.googleapis.com/token`
- Send Email: `https://www.googleapis.com/gmail/v1/users/me/messages/send`

### Required OAuth Scopes
```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/gmail.modify
```

## Testing Checklist

Before going to production, ensure:
- [ ] Service account created and key downloaded
- [ ] Gmail API enabled in Cloud Console
- [ ] Domain-wide delegation configured with correct scopes
- [ ] Environment variables set correctly
- [ ] Test email sends successfully
- [ ] Error handling works (test with invalid config)
- [ ] Logs show successful authentication
- [ ] Email appears in "Sent" folder of delegated account

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

## Migration to Multi-Provider Setup

The email service now supports multiple providers with automatic failover:

1. **Primary**: SendGrid (Free tier, simple setup)
2. **Fallback**: Google Workspace Gmail API (when SendGrid fails)
3. **Removed**: Direct Web3Forms integration (security improvement)

Benefits:
- **Cost Savings**: SendGrid's free tier covers up to 3,000 emails/month
- **Reliability**: Automatic failover to Google Workspace if SendGrid fails
- **Simplicity**: SendGrid requires only an API key vs complex OAuth setup
- **Flexibility**: Easy to add more providers or change priority

### Provider Priority

The system tries providers in this order:
1. SendGrid (if SENDGRID_API_KEY is set)
2. Google Workspace (if GOOGLE_SERVICE_ACCOUNT_KEY is set)

You can configure either one or both providers. With both configured, the system automatically falls back if the primary fails.

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure Google Workspace service account
- [ ] Enable domain-wide delegation
- [ ] Set up Turnstile (site key + secret key)
- [ ] Test email sending in preview environment
- [ ] Verify email templates look correct
- [ ] Check error handling
- [ ] Monitor initial production deployments