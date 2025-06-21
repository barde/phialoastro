# Deployment Guide

This guide covers the complete deployment setup for the Phialo Design website using Cloudflare Workers, including local development, PR previews, and production deployments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Local Development](#local-development)
4. [PR Preview Deployments](#pr-preview-deployments)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Architecture Overview](#architecture-overview)

## Prerequisites

- Node.js 20+ and npm
- Cloudflare account with Workers enabled
- GitHub repository access (admin for secrets configuration)
- Wrangler CLI (installed automatically with npm)

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/barde/phialoastro.git
cd phialoastro

# Install main project dependencies
cd phialo-design
npm install

# Install worker dependencies
cd ../workers
npm install
```

### 2. Configure Cloudflare Authentication

You need to authenticate Wrangler with your Cloudflare account:

```bash
# Login to Cloudflare (opens browser)
npx wrangler login

# Verify authentication
npx wrangler whoami
```

### 3. Set Up GitHub Secrets

For automated deployments, configure these repository secrets:

1. **Get your Cloudflare credentials:**
   - **API Token**: Create at https://dash.cloudflare.com/profile/api-tokens
     - Use "Edit Cloudflare Workers" template
     - Add permissions: Account → Cloudflare Workers Scripts:Edit
   - **Account ID**: Find at https://dash.cloudflare.com/ (right sidebar)

2. **Add to GitHub:**
   - Go to Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` with your API token
   - Add `CLOUDFLARE_ACCOUNT_ID` with your account ID
   - Add `WEB3FORMS_ACCESS_KEY` with your Web3Forms access key (get at https://web3forms.com)

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed instructions.

## Local Development

### Option 1: Develop with Astro Only

```bash
cd phialo-design
npm run dev
# Visit http://localhost:4321
```

### Option 2: Develop with Worker (Production-like)

```bash
# Terminal 1: Build and watch Astro
cd phialo-design
npm run build -- --watch

# Terminal 2: Run Worker locally
cd workers
npm run dev
# Visit http://localhost:8787
```

### Option 3: Full Development Environment

```bash
cd phialo-design
npm run dev:full
# Runs both Astro and Worker concurrently
```

## PR Preview Deployments

### Automatic Deployments

When you create or update a PR that modifies files in:
- `workers/` directory
- `phialo-design/` directory
- `.github/workflows/worker-preview.yml`

The GitHub Actions workflow automatically:
1. Builds the Astro site
2. Deploys a preview Worker
3. Comments the preview URL on the PR

### Manual Preview Deployment

To manually deploy a preview from your local machine:

```bash
cd workers
npm run deploy:preview
```

The preview URL format: `https://phialo-design-preview.{subdomain}.workers.dev`

## Production Deployment

### Manual Production Deployment

⚠️ **Warning**: Only deploy to production from the main branch after thorough testing.

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Build the Astro site
cd phialo-design
npm run build

# Deploy to production
cd ../workers
npm run deploy:production
```

### Production Configuration

Before deploying to production:

1. **Update `workers/wrangler.toml`:**
```toml
[env.production]
name = "phialo-design"
route = "phialo.de/*"
zone_id = "YOUR_ZONE_ID"  # Get from Cloudflare dashboard
workers_dev = false
```

2. **Set environment variables in Cloudflare:**
   - Go to Workers & Pages → phialo-design → Settings → Variables
   - Add `WEB3FORMS_ACCESS_KEY` with your access key
   - This is required for the contact form to function

### Setting Up Custom Domain

1. Add your domain to Cloudflare
2. Get the Zone ID from the dashboard
3. Update `wrangler.toml` with your Zone ID
4. Deploy the Worker
5. The route will be automatically configured

## Troubleshooting

### Common Issues

#### 1. "CLOUDFLARE_API_TOKEN secret is not configured"
- Ensure secrets are added to GitHub repository settings
- Secret names are case-sensitive
- Check you're in the correct repository

#### 2. Worker Returns 500 Error
- Check `npx wrangler tail` for live logs
- Verify the build output exists in `phialo-design/dist`
- Ensure all dependencies are installed

#### 3. Preview URL Not Working
- Verify deployment succeeded in GitHub Actions
- Check Worker logs in Cloudflare dashboard
- Ensure no conflicting Worker names

#### 4. Build Failures
```bash
# Clean and rebuild
cd phialo-design
rm -rf dist node_modules
npm install
npm run build
```

### Debug Commands

```bash
# View Worker logs
cd workers
npm run tail

# Check deployment status
npx wrangler deployments list

# Test Worker locally with production build
npm run preview
```

## Architecture Overview

### Deployment Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   GitHub    │────▶│    GitHub    │────▶│   Cloudflare    │
│    Push     │     │   Actions    │     │    Workers      │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Build Astro  │
                    │    Site      │
                    └──────────────┘
```

### Worker Architecture

The Worker handles:
- **Static File Serving**: Serves built Astro files with proper MIME types
- **Security Headers**: Implements CSP, X-Frame-Options, etc.
- **Caching**: Edge caching for optimal performance
- **URL Handling**: Clean URLs, trailing slash removal, 404 pages

### File Structure

```
phialoastro/
├── phialo-design/          # Astro site source
│   ├── src/               # Source files
│   ├── dist/              # Built output (git-ignored)
│   └── package.json
├── workers/               # Cloudflare Worker
│   ├── src/              # Worker source code
│   ├── wrangler.toml     # Worker configuration
│   └── package.json
└── .github/workflows/     # GitHub Actions
    └── worker-preview.yml # PR preview workflow
```

## Security Considerations

1. **API Token Security**
   - Never commit tokens to repository
   - Use minimal required permissions
   - Rotate tokens regularly
   - Set expiration dates when possible

2. **Production Protection**
   - Limit production deployments to protected branches
   - Require PR reviews before merging
   - Use environment-specific tokens

3. **Content Security**
   - Worker implements security headers
   - CSP configured for Weglot, YouTube, and Web3Forms
   - X-Frame-Options prevents clickjacking

4. **Environment Variables**
   - `WEB3FORMS_ACCESS_KEY` is a public key (not secret)
   - Required for contact form functionality
   - Safe to expose in client-side code

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Documentation](https://docs.astro.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues specific to this deployment:
1. Check the troubleshooting section above
2. Review Worker logs with `npm run tail`
3. Check GitHub Actions logs for deployment errors
4. Open an issue in the repository with details