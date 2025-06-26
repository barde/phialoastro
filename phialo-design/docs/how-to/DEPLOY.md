# Deployment Guide - Phialo Design

This is the consolidated deployment guide for the Phialo Design website using Cloudflare Workers. This guide covers local development, PR previews, and production deployments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Deploy](#quick-deploy)
3. [Initial Setup](#initial-setup)
4. [Local Development](#local-development)
5. [PR Preview Deployments](#pr-preview-deployments)
6. [Production Deployment](#production-deployment)
7. [Environment Variables](#environment-variables)
8. [Cloudflare Setup](#cloudflare-setup)
9. [Domain Setup](#domain-setup)
10. [Troubleshooting](#troubleshooting)
11. [Architecture Overview](#architecture-overview)
12. [Performance Optimization](#performance-optimization)
13. [Security Considerations](#security-considerations)
14. [Emergency Procedures](#emergency-procedures)

## Prerequisites

- Node.js 20+ and npm
- Cloudflare account with Workers enabled
- GitHub repository access (admin for secrets configuration)
- Wrangler CLI (installed automatically with npm)

## Quick Deploy

### 1. Build locally
```bash
cd phialo-design
npm install
npm run build
```

### 2. Deploy with Wrangler
```bash
# Deploy to production
npm run deploy

# Deploy preview
npm run deploy:preview
```

### 3. Quick Commands Reference
```bash
# Local Development
cd phialo-design && npm run dev          # Astro only (recommended)
cd phialo-design && npm run dev:full     # Worker + Astro (production-like)
cd workers && npm run dev                # Worker only

# Building
cd phialo-design && npm run build        # Build Astro site
cd workers && npm run build              # Build Worker

# View logs
cd workers && npm run tail

# Check deployment status
npx wrangler deployments list
```

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

#### Option 1: Using Environment Variable (Recommended for CI/CD)
```bash
# Set your API token
export CLOUDFLARE_API_TOKEN="your-api-token-here"

# Verify authentication
npx wrangler whoami
```

#### Option 2: Using Wrangler Login (Recommended for local development)
```bash
# Login to Cloudflare (opens browser)
npx wrangler login

# Verify authentication
npx wrangler whoami
```

## Local Development

### Option 1: Develop with Astro Only (Recommended)
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
4. Cleans up the worker when PR is closed

Preview URL format: `https://phialo-pr-{number}.meise.workers.dev`

### Manual Preview Deployment

To manually deploy a preview from your local machine:

```bash
cd workers
npm run deploy:preview
```

The preview URL format: `https://phialo-design-preview.{subdomain}.workers.dev`

## Production Deployment

### ⚠️ Pre-Deployment Checklist

- [ ] On main branch (`git checkout main`)
- [ ] Latest changes pulled (`git pull origin main`)
- [ ] Tests passing (`npm run test:run`)
- [ ] Lint and typecheck passing (`npm run lint && npm run typecheck`)
- [ ] Preview deployment tested
- [ ] Zone ID configured in `wrangler.toml`
- [ ] Environment variables set in Cloudflare dashboard

### Manual Production Deployment

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

Before deploying to production, update `workers/wrangler.toml`:

```toml
[env.production]
name = "phialo-design"
route = "phialo.de/*"
zone_id = "YOUR_ZONE_ID"  # Get from Cloudflare dashboard
workers_dev = false
```

## Environment Variables

### Required Variables

1. **WEB3FORMS_ACCESS_KEY** (Required for contact form)
   - Get your free key at [https://web3forms.com](https://web3forms.com)
   - Enter email: kontakt@phialo.de
   - This is a public key (not secret)
   - Without this, the contact form will not function

2. **PUBLIC_SITE_URL**
   - Set to: `https://phialo.de`

### Setting Environment Variables

#### In Cloudflare Dashboard:
1. Go to Workers & Pages → phialo-design → Settings → Variables
2. Add each variable with its value
3. Save changes

#### For GitHub Actions:
Set these repository secrets:
- `CLOUDFLARE_API_TOKEN`: Your API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `WEB3FORMS_ACCESS_KEY`: Your Web3Forms access key

## Cloudflare Setup

### 1. Create API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom token with:
   - **Account** → Cloudflare Workers Scripts:Edit
   - **Account** → Workers KV Storage:Edit
   - **Zone** → Workers Routes:Edit (for custom domain)
   - **Zone** → Zone:Read (for custom domain)
4. Set Account Resources to your specific account
5. Optionally set expiration date and IP filtering
6. Click "Continue to summary" → "Create Token"
7. **Important**: Copy the token immediately

### 2. Find Your Account ID

1. Visit https://dash.cloudflare.com/
2. Select your account
3. Look for **Account ID** in the right sidebar
4. Copy this value

### 3. Find Your Zone ID (for custom domain)

1. Go to your domain in Cloudflare dashboard
2. Look for **Zone ID** in the right sidebar
3. Copy this value

### 4. Add GitHub Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Add:
   - `CLOUDFLARE_API_TOKEN`: Your API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID
   - `WEB3FORMS_ACCESS_KEY`: Your Web3Forms key

## Domain Setup

### Custom Domain Configuration

1. Add your domain to Cloudflare (if not already)
2. Update `workers/wrangler.toml` with your Zone ID
3. Deploy the Worker
4. The route will be automatically configured

### DNS Configuration

If your domain is on Cloudflare, DNS will be configured automatically. Otherwise:
1. Add CNAME record pointing to your Worker
2. Enable Cloudflare proxy (orange cloud)

## Troubleshooting

### Common Issues

#### 1. "CLOUDFLARE_API_TOKEN secret is not configured"
- Ensure secrets are added to GitHub repository settings
- Secret names are case-sensitive
- Check you're in the correct repository

#### 2. Worker Returns 500 Error
```bash
# Check live logs
cd workers && npm run tail

# Verify build output exists
ls phialo-design/dist

# Test locally
npm run preview
```

#### 3. Preview URL Not Working
- Verify deployment succeeded in GitHub Actions
- Check Worker logs in Cloudflare dashboard
- Ensure no conflicting Worker names

#### 4. Build Failures
```bash
# Clean and rebuild
cd phialo-design
rm -rf dist node_modules .astro
npm install
npm run build
```

#### 5. Authentication Errors
- Verify API token has correct permissions
- Check if token has expired
- Ensure token is for correct account

### Debug Commands

```bash
# View Worker logs
cd workers
npm run tail

# Check deployment status
npx wrangler deployments list

# Test Worker locally with production build
npm run preview

# List recent deployments
npx wrangler deployments list

# Check GitHub Actions logs
gh run list --workflow=worker-preview.yml
gh run view <run-id> --log-failed
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
    ├── worker-preview.yml # PR preview workflow
    └── cleanup-preview.yml # PR cleanup workflow
```

### Deployment Environments

#### Production (`phialo-design`)
- **URL**: https://phialo.de (custom domain)
- **Deployment**: Manual via CLI
- **Branch**: Main branch only
- **Note**: Requires zone permissions

#### Preview (`phialo-design-preview`)
- **URL**: https://phialo-design-preview.meise.workers.dev
- **Deployment**: Manual or automatic on merge to master
- **Purpose**: Latest master branch preview

#### Ephemeral PR Previews (`phialo-pr-{number}`)
- **URL**: https://phialo-pr-{number}.meise.workers.dev
- **Deployment**: Automatic on PR creation/update
- **Cleanup**: Automatic on PR close/merge
- **Purpose**: Isolated testing for each PR

## Performance Optimization

### Cloudflare Dashboard Settings

Navigate to your domain in Cloudflare dashboard and enable:

1. **Speed → Optimization**
   - Brotli Compression: ON
   - Early Hints: ON
   - Auto Minify: JavaScript ✅, CSS ✅, HTML ❌

2. **Network**
   - HTTP/3 (with QUIC): ON

3. **Caching → Configuration**
   - Browser Cache TTL: 1 year
   - Always Online™: ON

4. **Speed → Optimization → Content Optimization**
   - Rocket Loader™: OFF (can interfere with React)
   - Mirage: ON
   - Polish: Lossy (if available)

### Expected Improvements
- 20-30% reduction in transfer size (Brotli)
- 15-20% faster page loads (HTTP/3)
- Improved Core Web Vitals scores

## Security Considerations

### API Token Security
- Never commit tokens to repository
- Use minimal required permissions
- Rotate tokens regularly
- Set expiration dates when possible

### Production Protection
- Limit production deployments to protected branches
- Require PR reviews before merging
- Use environment-specific tokens

### Content Security
- Worker implements security headers
- CSP configured for YouTube and Web3Forms
- X-Frame-Options prevents clickjacking

### Environment Variables
- `WEB3FORMS_ACCESS_KEY` is a public key (not secret)
- Required for contact form functionality
- Safe to expose in client-side code

## Emergency Procedures

### Emergency Rollback

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback --env production

# Or deploy a specific commit
git checkout <commit-hash>
cd phialo-design && npm run build
cd ../workers && npm run deploy:production
```

### If Site is Broken in Production
1. Revert to last known good commit
2. Deploy from Cloudflare Workers dashboard
3. Check Workers script for CSP/header issues
4. Verify environment variables and KV namespaces

### Worker Management

#### Listing Workers
```bash
# Check if a specific worker exists
npx wrangler deployments list --name "worker-name"

# Delete a specific worker
npx wrangler delete --name "worker-name" --force

# View worker logs
npx wrangler tail "worker-name"
```

#### Cleaning Up Ephemeral Workers
```bash
# Check specific PR workers
for pr in 100 101 102 103; do
  echo "Checking phialo-pr-$pr..."
  npx wrangler delete --name "phialo-pr-$pr" --force 2>/dev/null || echo "Not found"
done
```

Note: The cleanup-preview.yml workflow automatically handles worker cleanup when PRs are closed.

## Important URLs

- **Local Dev**: http://localhost:4321 (Astro) or http://localhost:8787 (Worker)
- **Preview**: https://phialo-design-preview.{subdomain}.workers.dev
- **Production**: https://phialo.de

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Documentation](https://docs.astro.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Worker logs with `npm run tail`
3. Check GitHub Actions logs for deployment errors
4. Open an issue in the repository with details