# Cloudflare Workers Setup Guide

This guide explains how to configure the necessary Cloudflare secrets for the GitHub Actions workflow that deploys PR previews.

## Prerequisites

- A Cloudflare account with Workers enabled
- Admin access to the GitHub repository

## Required Secrets

The GitHub Actions workflow requires two secrets to deploy Workers:

1. **CLOUDFLARE_API_TOKEN** - API token for authentication
2. **CLOUDFLARE_ACCOUNT_ID** - Your Cloudflare account identifier

## Step 1: Create a Cloudflare API Token

1. Log in to your Cloudflare dashboard at https://dash.cloudflare.com/
2. Navigate to **My Profile** → **API Tokens** (or directly visit https://dash.cloudflare.com/profile/api-tokens)
3. Click **Create Token**
4. Use the **Custom token** template with these permissions:
   - **Account** → Cloudflare Workers Scripts:Edit
   - **Account** → Workers KV Storage:Edit
   - **Zone** → Zone:Read (if you plan to use custom domains)
5. Set **Account Resources** to include your specific account
6. Optionally set an expiration date and IP filtering for security
7. Click **Continue to summary** → **Create Token**
8. **Important**: Copy the token immediately as it won't be shown again

## Step 2: Find Your Cloudflare Account ID

1. Visit https://dash.cloudflare.com/
2. Select your account if you have multiple
3. Look for the **Account ID** in the right sidebar
4. Copy this value

## Step 3: Add Secrets to GitHub Repository

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the first secret:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: The API token you created in Step 1
   - Click **Add secret**
5. Click **New repository secret** again
6. Add the second secret:
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID from Step 2
   - Click **Add secret**

## Step 4: Update wrangler.toml (if needed)

If you're deploying to a custom domain, update the `zone_id` in `workers/wrangler.toml`:

```toml
[env.production]
name = "phialo-design"
route = "phialo.de/*"
zone_id = "YOUR_ZONE_ID"  # Update this with your actual zone ID
```

To find your Zone ID:
1. Go to your domain in the Cloudflare dashboard
2. Look for **Zone ID** in the right sidebar

## Verifying the Setup

Once you've added the secrets:

1. Create or update a PR that modifies files in `workers/` or `phialo-design/`
2. The GitHub Actions workflow should automatically run
3. Check the Actions tab to see if the deployment succeeds
4. Look for a comment on the PR with the preview URL

## Troubleshooting

### Workflow fails with "CLOUDFLARE_API_TOKEN secret is not configured"
- Ensure the secret name is exactly `CLOUDFLARE_API_TOKEN` (case-sensitive)
- Check that the secret was added to the correct repository
- Verify you're looking at the right environment (repository secrets vs environment secrets)

### Workflow fails with authentication errors
- Verify the API token has the correct permissions
- Check if the token has expired
- Ensure the token is for the correct Cloudflare account

### Deployment succeeds but preview URL doesn't work
- Check that Workers are enabled for your Cloudflare account
- Verify the Worker name doesn't conflict with existing Workers
- Look at the Worker logs in the Cloudflare dashboard

## Security Best Practices

1. **Rotate tokens regularly** - Create new tokens and update secrets periodically
2. **Use minimal permissions** - Only grant the permissions needed for deployment
3. **Set token expiration** - Use expiration dates on API tokens when possible
4. **Restrict by IP** - If deploying from known GitHub Actions IPs, add IP restrictions
5. **Monitor usage** - Check the Cloudflare audit logs for unexpected token usage

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)