# Cloudflare Preview Deployment Token Setup

## Quick Setup for Preview Deployments Only

Since preview deployments to `*.workers.dev` don't need Zone permissions, you can create a minimal API token:

### 1. Create the API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Select "Custom token" → "Get started"
4. Configure the token:
   - **Token name**: `phialo-preview-deployments`
   - **Permissions**: 
     - Account → Workers Scripts → Edit
   - **Account resources**: Select your specific account
   - **Client IP Address Filtering**: (optional, leave blank)
   - **TTL**: (optional, leave blank for no expiration)

### 2. Add to GitHub Secrets

```bash
# Add the token to repository secrets
gh secret set CLOUDFLARE_API_TOKEN

# Paste the token when prompted
```

### 3. Verify Setup

After adding the token, re-run any failed workflow to test the preview deployment.

## Full Production Token (for later)

When you're ready to deploy to production (phialo.de), you'll need a token with additional permissions:
- Account → Workers Scripts → Edit
- Account → Workers KV Storage → Edit  
- Zone → Workers Routes → Edit
- Zone → Zone → Read

But for now, the minimal token above is sufficient for PR preview deployments!