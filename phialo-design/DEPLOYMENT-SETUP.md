# Cloudflare Workers Deployment Environment Setup

This guide walks through the initial setup required to deploy the Phialo Design website using Cloudflare Workers with Static Assets.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Cloudflare account (free tier is sufficient)
- Access to the Cloudflare dashboard

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers deployments.

```bash
# Install globally
npm install -g wrangler

# Verify installation
wrangler --version
```

## Step 2: Authenticate with Cloudflare

Connect Wrangler to your Cloudflare account:

```bash
wrangler login
```

This command will:
1. Open your default browser
2. Prompt you to log in to Cloudflare
3. Ask for permission to access your account
4. Display a success message once authenticated

## Step 3: Gather Required Information

### From Cloudflare Dashboard

1. **Account ID**:
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select any domain
   - Find "Account ID" in the right sidebar
   - Copy this value

2. **Zone ID** (only if using custom domain):
   - Navigate to your domain (phialo.de)
   - On the Overview page, find "Zone ID" in the right sidebar
   - Copy this value

### Update Configuration

Edit `workers/wrangler.json` with your Account ID:

```json
{
  "name": "phialo-design",
  "account_id": "YOUR_ACCOUNT_ID_HERE",
  "compatibility_date": "2024-01-01",
  "assets": {
    "directory": "../dist",
    "serve_directly": true,
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

## Step 4: Initial Deployment

### Build and Deploy

```bash
# Navigate to project root
cd /path/to/phialo-design

# Build the Astro site
npm run build

# Deploy to Workers
npm run deploy:worker
```

On first deployment, Wrangler will:
- Create a new Worker named "phialo-design"
- Upload all static assets from the `dist` directory
- Provide a deployment URL: `https://phialo-design.<your-subdomain>.workers.dev`

### Verify Deployment

1. Visit the provided URL
2. Check that:
   - [ ] Homepage loads correctly
   - [ ] Navigation works
   - [ ] Images display properly
   - [ ] Language switching functions
   - [ ] 404 page appears for non-existent routes

## Step 5: Custom Domain Setup (Optional)

To use phialo.de instead of the workers.dev subdomain:

### Option A: Route Configuration

Add route configuration to `workers/wrangler.json`:

```json
{
  "name": "phialo-design",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2024-01-01",
  "routes": [
    {
      "pattern": "phialo.de/*",
      "zone_id": "YOUR_ZONE_ID"
    },
    {
      "pattern": "www.phialo.de/*",
      "zone_id": "YOUR_ZONE_ID"
    }
  ],
  "assets": {
    "directory": "../dist",
    "serve_directly": true,
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

### Option B: Custom Domain in Dashboard

1. Go to Workers & Pages in Cloudflare Dashboard
2. Select your Worker
3. Go to "Settings" → "Domains & Routes"
4. Add custom domain

### Deploy with Custom Domain

```bash
# Redeploy with route configuration
npm run deploy:worker
```

## Step 6: Environment Configuration

### Development vs Production

The `wrangler.json` includes environment configurations:

```json
{
  "env": {
    "preview": {
      "name": "phialo-design-preview",
      "vars": {
        "PUBLIC_SITE_URL": "https://preview.phialo.de"
      }
    }
  }
}
```

### Deploy to Different Environments

```bash
# Deploy to preview environment
npm run deploy:worker:preview

# Deploy to production
npm run deploy:worker
```

## Step 7: Secrets Management (If Needed)

For sensitive values that shouldn't be in config files:

```bash
# Add a secret
wrangler secret put MY_SECRET_KEY

# List secrets
wrangler secret list

# Delete a secret
wrangler secret delete MY_SECRET_KEY
```

## Step 8: Verify DNS Configuration

If using a custom domain, ensure DNS is configured correctly:

1. **For root domain (phialo.de)**:
   - Type: CNAME
   - Name: @
   - Target: phialo-design.<your-subdomain>.workers.dev
   - Proxy status: Proxied (orange cloud)

2. **For www subdomain**:
   - Type: CNAME
   - Name: www
   - Target: phialo-design.<your-subdomain>.workers.dev
   - Proxy status: Proxied (orange cloud)

## Deployment Commands Reference

```bash
# Local development
npm run dev:worker          # Serve built site locally on port 8787

# Deployment
npm run deploy:worker       # Deploy to production
npm run deploy:worker:preview  # Deploy to preview environment

# Debugging
cd workers && wrangler tail  # View real-time logs
cd workers && wrangler deployment list  # List recent deployments
```

## Troubleshooting

### Authentication Issues
```bash
# Re-authenticate
wrangler logout
wrangler login
```

### Deployment Failures
- Check that `npm run build` completes successfully
- Verify `workers/wrangler.json` syntax is valid
- Ensure you have the correct account permissions

### Assets Not Loading
- Confirm `assets.directory` points to `../dist`
- Check that build output exists in `dist` directory
- Verify no files exceed 25MB limit

### Custom Domain Not Working
- Allow 5-10 minutes for DNS propagation
- Verify DNS records in Cloudflare dashboard
- Check that SSL certificate is active

## Next Steps

1. Set up CI/CD pipeline for automatic deployments
2. Configure monitoring and alerts
3. Implement performance optimizations from `PERFORMANCE-OPTIMIZATIONS.md`
4. Review security headers and CSP settings

## Support Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Workers Discord Community](https://discord.cloudflare.com)
- [Cloudflare Status Page](https://www.cloudflarestatus.com/)

---

**Note**: Keep your Account ID and Zone ID secure. While not secret, they shouldn't be committed to public repositories.