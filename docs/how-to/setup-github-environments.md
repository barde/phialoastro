# Setting Up GitHub Environments for Secure Deployments

This guide walks you through setting up GitHub Environments for secure secret management and deployment protection.

## Why Use GitHub Environments?

- **Security**: Environment-specific secrets are isolated
- **Protection**: Require approvals for production deployments
- **Audit Trail**: Track all deployments and who approved them
- **Fork Safety**: Secrets aren't exposed to forked PRs without approval

## Step 1: Create the Preview Environment

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it: `preview`
5. Click **Configure environment**

### Add Environment Secrets

Click **Add secret** for each:

1. **RESEND_API_KEY**
   - Use a test/development API key from Resend
   - This should be different from your production key

2. **FROM_EMAIL**
   - Value: `onboarding@resend.dev`
   - This is Resend's test email that works without domain verification

3. **TO_EMAIL**
   - Value: Your test email address
   - Where test emails should be sent

### Configure Environment Settings

1. **Environment URL**: 
   ```
   https://phialo-pr-${{ github.event.pull_request.number }}.meise.workers.dev
   ```

2. **Deployment branches**:
   - Leave as "All branches" for PR previews

3. **Protection rules**:
   - Leave unchecked for preview (we want fast PR deployments)

## Step 2: Create the Production Environment

1. Click **New environment** again
2. Name it: `production`
3. Click **Configure environment**

### Add Production Secrets

1. **RESEND_API_KEY**
   - Your production Resend API key
   - Keep this separate from test keys

2. **FROM_EMAIL**
   - Value: `noreply@phialo.de` (or your verified domain email)
   - Must be verified in Resend

3. **TO_EMAIL**
   - Value: `info@phialo.de`
   - Where real contact form submissions go

### Configure Production Protection

1. **Environment URL**: 
   ```
   https://phialo.de
   ```

2. **Protection rules**:
   - ✅ **Required reviewers**
     - Add yourself and other maintainers
     - Set to require 1-2 approvals
   - ✅ **Restrict deployment branches**
     - Add: `main` or `master` (your default branch)
     - Optionally add: `release/*` for release branches
   - ✅ **Wait timer** (optional)
     - Set to 5-10 minutes for safety

## Step 3: Update Repository Settings

### Remove Repository-Level Secrets

Once environments are working:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Delete these repository secrets (now in environments):
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `TO_EMAIL`
3. Keep these repository secrets (used by all environments):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ZONE_ID`

## Step 4: How It Works

### PR Preview Deployments

When a PR is created:
1. Workflow runs with `environment: preview`
2. Uses preview environment secrets (test API key)
3. No approval required
4. Deploys to `phialo-pr-{number}.meise.workers.dev`

### Production Deployments

When deploying to production:
1. Workflow runs with `environment: production`
2. Waits for required approvals
3. Uses production secrets
4. Deploys to `phialo.de`

## Step 5: Testing

1. **Create a test PR**:
   - Should deploy without approval
   - Check logs to ensure preview secrets are used

2. **Test production deployment**:
   - Should require approval
   - Should use production secrets

## Security Benefits

1. **Forked PRs**: Can't access secrets without maintainer approval
2. **Audit Trail**: See who deployed what and when
3. **Separation**: Test and production keys are isolated
4. **Approval Flow**: Production changes require review

## Troubleshooting

### "Environment not found" error
- Ensure environment name matches exactly (case-sensitive)
- Check that the environment exists in repository settings

### Secrets not available
- Verify secrets are added to the specific environment, not repository
- Check workflow has `environment:` key specified

### Deployment waiting forever
- Check protection rules - maybe waiting for approval
- Look at Actions tab → Deployments for pending approvals

## Best Practices

1. **Use different API keys** for preview vs production
2. **Rotate keys regularly** (every 90 days)
3. **Monitor deployments** in the Environments tab
4. **Review deployment history** for security audits
5. **Test with a non-admin account** to verify protection rules

## Additional Resources

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Environment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)