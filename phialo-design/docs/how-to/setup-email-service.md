# Email Service Setup Guide - Google Workspace Gmail API

This guide walks you through setting up the Google Workspace Gmail API for sending emails from the Phialo Design contact form.

## Prerequisites

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

## Migration from Multi-Provider Setup

The email service now uses only Google Workspace Gmail API:

1. **Removed**: Cloudflare Email Workers integration
2. **Removed**: SendGrid integration
3. **Active**: Google Workspace Gmail API with domain-wide delegation

Benefits:
- Single, reliable email provider
- Better deliverability with Google infrastructure
- Native integration with Google Workspace
- Detailed logging and monitoring

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure Google Workspace service account
- [ ] Enable domain-wide delegation
- [ ] Set up Turnstile (site key + secret key)
- [ ] Test email sending in preview environment
- [ ] Verify email templates look correct
- [ ] Check error handling
- [ ] Monitor initial production deployments