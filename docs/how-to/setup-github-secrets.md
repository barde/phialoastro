# Setting Up GitHub Secrets for Email Service

This guide explains how to configure GitHub repository secrets for the email service functionality.

## Required Secrets

The following secrets need to be added to your GitHub repository for the email service to work in deployments:

### Email Service Secrets

1. **RESEND_API_KEY** (Required)
   - Your Resend API key (starts with `re_`)
   - Get it from: https://resend.com/api-keys
   - Example: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **FROM_EMAIL** (Required)
   - The email address to send from
   - Must be verified in Resend or use `onboarding@resend.dev` for testing
   - Example: `noreply@phialo.de` or `onboarding@resend.dev`

3. **TO_EMAIL** (Required)
   - The email address to receive contact form submissions
   - Example: `info@phialo.de`

### Optional Secrets

4. **TURNSTILE_SECRET_KEY** (Optional)
   - Cloudflare Turnstile secret key for CAPTCHA protection
   - Get it from: https://dash.cloudflare.com/turnstile

## How to Add Secrets

### Via GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - **Name**: Enter the secret name exactly as shown above (e.g., `RESEND_API_KEY`)
   - **Value**: Enter the secret value
5. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI if you haven't already
# brew install gh (macOS) or see https://cli.github.com/

# Authenticate
gh auth login

# Add secrets
gh secret set RESEND_API_KEY
# Paste your Resend API key when prompted

gh secret set FROM_EMAIL
# Enter: onboarding@resend.dev (or your verified email)

gh secret set TO_EMAIL  
# Enter: info@phialo.de (or your recipient email)

# Optional: Add Turnstile secret
gh secret set TURNSTILE_SECRET_KEY
# Paste your Turnstile secret key when prompted
```

## Verify Secrets

To verify your secrets are set correctly:

```bash
gh secret list
```

You should see:
```
CLOUDFLARE_ACCOUNT_ID  2025-06-29T18:26:11Z
CLOUDFLARE_API_TOKEN   2025-06-30T10:17:26Z
CLOUDFLARE_ZONE_ID     2025-06-29T18:30:01Z
FROM_EMAIL            [date]
RESEND_API_KEY        [date]
TO_EMAIL              [date]
```

## Testing

After adding the secrets:

1. Create a new PR or push to an existing PR
2. Wait for the PR preview deployment to complete
3. Visit the preview URL (e.g., `https://phialo-pr-123.meise.workers.dev`)
4. Test the contact form - it should now send emails successfully

## Troubleshooting

### Secrets Not Working in PR Previews

If secrets aren't working in PR preview deployments:

1. Check that the secrets are added at the repository level (not environment-specific)
2. Verify the workflow file includes the secrets in the deployment step
3. Check the GitHub Actions logs for any errors

### Email Not Sending

If emails aren't being sent:

1. Verify the `RESEND_API_KEY` is correct and active
2. Check that `FROM_EMAIL` is either:
   - `onboarding@resend.dev` (for testing)
   - A verified domain email in your Resend account
3. Check the browser console for API errors
4. Review Cloudflare Worker logs for detailed error messages

## Security Notes

- Never commit secrets to the repository
- Use GitHub's secret management for all sensitive values
- Rotate API keys regularly
- For production, use environment-specific secrets