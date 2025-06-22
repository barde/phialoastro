# Cloudflare Workers Deployment Instructions

## Prerequisites

1. **Get your Cloudflare API Token**:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use the "Edit Cloudflare Workers" template
   - Set permissions: "Account:Cloudflare Workers Scripts:Edit"
   - Copy the token

2. **Get your Zone ID**:
   - Go to your domain in Cloudflare dashboard
   - Find the Zone ID in the right sidebar
   - Copy it

## Deployment Steps

### Option 1: Using Environment Variable (Recommended)

```bash
# Set your API token
export CLOUDFLARE_API_TOKEN="your-api-token-here"

# Navigate to workers directory
cd workers

# Deploy to preview environment
npm run deploy:preview

# Deploy to production (after testing)
npm run deploy:production
```

### Option 2: Using Wrangler Login

```bash
# Navigate to workers directory
cd workers

# Login to Cloudflare
npx wrangler login

# Deploy to preview environment
npm run deploy:preview

# Deploy to production (after testing)
npm run deploy:production
```

## Update Configuration

Before deploying to production, update `workers/wrangler.toml`:

```toml
[env.production]
name = "phialo-design"
route = "phialo.de/*"
zone_id = "YOUR_ACTUAL_ZONE_ID_HERE"  # <-- Replace this
workers_dev = false
```

## Verify Deployment

After deployment:

1. **Preview deployment**: Visit `https://phialo-design-preview.workers.dev`
2. **Production deployment**: Your site will be available at `phialo.de`

## GitHub Actions Setup

For automatic PR preview deployments:

1. Go to your GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `WEB3FORMS_ACCESS_KEY`: Your Web3Forms access key for contact form functionality

## Environment Variables

The following environment variables are required for full functionality:

- `WEB3FORMS_ACCESS_KEY`: Required for the contact form to work
  - Get your free key at [https://web3forms.com](https://web3forms.com)
  - This is a public key (not secret)
  - Without this, the contact form will not function

## Rollback Instructions

If something goes wrong:

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to a previous deployment
npx wrangler rollback [deployment-id]

# Or quickly switch back to Cloudflare Pages
# (Your Pages deployment is still active)
```

## Testing the Worker Locally

```bash
# Start local development server
cd workers
npm run dev

# The worker will be available at http://localhost:8787
```

## Next Steps

1. Deploy to preview environment first
2. Test thoroughly
3. Update zone_id in wrangler.toml
4. Deploy to production when ready
5. Monitor logs with `npm run tail`