# Cloudflare Pages Deployment - phialo.de

## Quick Deploy

### 1. Build locally
```bash
cd phialo-design
npm install
npm run build
```

### 2. Deploy with Wrangler
```bash
# Option 1: Install wrangler globally (one time)
npm install -g wrangler

# Option 2: Use npx (no installation required)
# The scripts in package.json have been updated to use npx

# Deploy to production
npm run deploy

# Deploy preview
npm run deploy:preview
```

### 3. Environment Variables

Set in Cloudflare Pages dashboard:
```
PUBLIC_SITE_URL=https://phialo.de
```

## Domain Setup

1. Add custom domain in Cloudflare Pages: `phialo.de`
2. DNS will be configured automatically if domain is on Cloudflare

## Files

- `wrangler.toml` - Deployment configuration
- `public/_headers` - Security headers
- `public/_redirects` - URL redirects
- Site URL: `https://phialo.de` (configured in astro.config.mjs)

## Deploy Commands

```bash
# Production deployment
npm run deploy

# Preview deployment
npm run deploy:preview
```