# Deployment Guide - Phialo Design

This guide covers deployment workflows for the Phialo Design website using Cloudflare Workers.

## Quick Links

- **[Environment Setup Guide](./ENVIRONMENT-SETUP-GUIDE.md)** - Complete guide for setting up new environments and secrets
- **[Manual Deployments](./manual-deployments.md)** - Various ways to trigger deployments
- **[Turnstile Setup](./setup-turnstile-preclearance.md)** - Configure bot protection

## Deployment Overview

### Deployment Methods

1. **Manual Deployment** (Recommended for Production)
   - Go to GitHub Actions → Manual Cloudflare Deployment
   - Select environment and branch
   - Click "Run workflow"

2. **Automatic Deployment**
   - **Master branch**: Auto-deploys to master environment on push
   - **Pull Requests**: Auto-creates preview environment
   - **Production**: Manual only (for safety)

3. **Local Deployment** (Development)
   ```bash
   cd workers
   pnpm run deploy:preview  # Deploy to preview
   pnpm run deploy          # Deploy to production
   ```

## Environment URLs

| Environment | URL | Purpose |
|------------|-----|---------|
| Production | https://phialo.de | Live website |
| Master | https://phialo-master.meise.workers.dev | Latest master branch |
| Preview | https://phialo-pr-{number}.meise.workers.dev | PR previews |

## Quick Start

### First Time Setup
1. **[Setup Environment](./ENVIRONMENT-SETUP-GUIDE.md)** - Configure all required secrets
2. **Deploy** - Use GitHub Actions or local deployment

### Daily Workflow
1. Create feature branch
2. Push changes (auto-creates PR preview)
3. Merge to master (auto-deploys to master environment)
4. Manual deploy to production when ready

## Local Development

### Development Server
```bash
cd phialo-design
pnpm run dev
# Visit http://localhost:4321
```

### Build and Preview
```bash
cd phialo-design
pnpm run build
pnpm run preview
# Visit http://localhost:4322
```

### Test Worker Locally
```bash
cd workers
pnpm run dev
# Visit http://localhost:8787
```

## GitHub Actions Workflows

### Manual Deployment
- **File**: `.github/workflows/manual-deploy.yml`
- **Trigger**: Manual via GitHub UI
- **Defaults**: Production environment, master branch
- **Usage**: Actions → Manual Cloudflare Deployment → Run workflow

### Master Auto-Deploy
- **File**: `.github/workflows/deploy-master.yml`
- **Trigger**: Push to master branch
- **Environment**: master
- **URL**: https://phialo-master.meise.workers.dev

### PR Preview
- **File**: `.github/workflows/cloudflare-pr-preview.yml`
- **Trigger**: PR opened/updated
- **Environment**: preview
- **URL**: https://phialo-pr-{number}.meise.workers.dev

## Troubleshooting

### Common Issues

1. **Deployment Failed**
   - Check GitHub Actions logs
   - Verify all environment secrets are set
   - See [Environment Setup Guide](./ENVIRONMENT-SETUP-GUIDE.md)

2. **Preview Not Created**
   - Ensure PR modifies files in `phialo-design/` or `workers/`
   - Check if preview environment has all secrets

3. **Email Not Sending**
   - Verify Resend domain is configured
   - Check FROM_EMAIL uses verified domain
   - Ensure RESEND_API_KEY is valid

4. **Turnstile Issues**
   - Verify site key matches environment
   - Check domain is added to Turnstile site
   - See [Turnstile Setup](./setup-turnstile-preclearance.md)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GitHub    │────▶│  Cloudflare  │────▶│   Users     │
│   Actions   │     │   Workers    │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    ├── Production (phialo.de)
       │                    ├── Master (*.workers.dev)
       │                    └── Preview (*.workers.dev)
       │
       └── Builds Astro site
           Deploys to Workers
```

## Security

- All sensitive configuration is stored in GitHub environment secrets
- No repository-level secrets (everything is environment-specific)
- Turnstile protects contact forms from bots
- CSP headers configured in Workers

## Related Documentation

- [Environment Setup Guide](./ENVIRONMENT-SETUP-GUIDE.md) - **Start here for new setup**
- [Manual Deployments](./manual-deployments.md) - Multiple deployment methods
- [Turnstile Setup](./setup-turnstile-preclearance.md) - Bot protection configuration
- [Email Service Setup](./setup-email-service.md) - Configure Resend for contact forms

---

**For complete environment setup instructions, see [ENVIRONMENT-SETUP-GUIDE.md](./ENVIRONMENT-SETUP-GUIDE.md)**