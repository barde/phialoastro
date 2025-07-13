# Fix PR Preview Worker Secrets Configuration

## Issue

PR preview deployments were failing to send emails because:
1. The Cloudflare Workers created for PR previews didn't have any secrets configured
2. There was a naming mismatch between workers (e.g., `phialo-pr-211` vs `phialo-pr-211-preview`)
3. GitHub repository secrets for the email service weren't set up
4. CI/CD workflows weren't passing email secrets to PR preview deployments

## Solution

### 1. Updated GitHub Actions Workflows

Modified three workflow files to pass email service secrets to Cloudflare Workers:

#### cloudflare-pr-preview.yml
```yaml
secrets: |
  RESEND_API_KEY
  FROM_EMAIL
  TO_EMAIL
env:
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  FROM_EMAIL: ${{ secrets.FROM_EMAIL }}
  TO_EMAIL: ${{ secrets.TO_EMAIL }}
```

#### manual-deploy.yml
Added the same email service secrets to manual deployments.

#### deploy-command.yml
Added email service secrets to PR comment-triggered deployments.

### 2. Created Documentation

- **[setup-github-secrets.md](../how-to/setup-github-secrets.md)** - Guide for adding required GitHub repository secrets
- **[cleanup-workers.sh](../../scripts/cleanup-workers.sh)** - Script to help identify and clean up unused workers

### 3. Worker Naming Convention

Confirmed the correct naming pattern:
- Production: `phialo-design`
- Preview: `phialo-design-preview`
- PR previews: `phialo-pr-{number}`
- Test: `phialo-design-test`

## Required GitHub Secrets

The following secrets must be added to the GitHub repository:

1. **RESEND_API_KEY** - Resend API key for sending emails
2. **FROM_EMAIL** - Sender email address (e.g., `onboarding@resend.dev`)
3. **TO_EMAIL** - Recipient email address (e.g., `info@phialo.de`)
4. **TURNSTILE_SECRET_KEY** (optional) - For CAPTCHA protection

## Next Steps

1. **Add GitHub Secrets**:
   ```bash
   gh secret set RESEND_API_KEY
   gh secret set FROM_EMAIL
   gh secret set TO_EMAIL
   ```

2. **Clean up unused workers** (if any):
   ```bash
   # Check for misnamed workers
   npx wrangler delete --name "phialo-pr-211-preview" --force
   ```

3. **Test the fix**:
   - Push to this PR to trigger a new deployment
   - The PR preview should now have access to email secrets
   - Contact form should work properly

## Security Considerations

- Secrets are only exposed to PR preview deployments from authorized users
- Each PR gets its own isolated worker instance
- Workers are automatically cleaned up when PRs are closed
- Secrets should be rotated regularly

## Impact

This fix ensures that:
- PR preview deployments have full functionality including email sending
- Developers can test the complete user flow before merging
- The deployment process is consistent across all environments
- Worker instances are properly managed and cleaned up