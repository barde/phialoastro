# Quick Setup: GitHub Secrets for Cloudflare Deployment

## 🔐 Required GitHub Secrets

Add these in: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. CLOUDFLARE_API_TOKEN
Create at: https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token" → "Custom token"
- Permissions needed:
  - Account → Workers Scripts:Edit
  - Account → Workers KV Storage:Edit
  - Zone → Workers Routes:Edit (for phialo.de)

### 2. CLOUDFLARE_ACCOUNT_ID
Find at: Cloudflare Dashboard → Right sidebar → "Account ID"

### 3. WEB3FORMS_ACCESS_KEY (Optional)
Get from: https://web3forms.com dashboard

## 📝 Zone ID Configuration

The Zone ID should be set as a GitHub secret:

### 4. CLOUDFLARE_ZONE_ID
Find at: Cloudflare Dashboard → phialo.de → Right sidebar → "Zone ID"

Add it as a GitHub secret:
```bash
gh secret set CLOUDFLARE_ZONE_ID
```

## ✅ Verify Setup
1. Create/update a PR
2. Check Actions tab
3. Look for preview URL in PR comments

## 📚 Detailed Guide
See [docs/how-to/setup-github-secrets.md](./docs/how-to/setup-github-secrets.md) for complete instructions.