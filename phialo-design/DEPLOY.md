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
WEB3FORMS_ACCESS_KEY=your-web3forms-access-key
```

#### Getting Web3Forms Access Key:
1. Visit [https://web3forms.com](https://web3forms.com)
2. Enter your email address (kontakt@phialo.de)
3. You'll receive an access key via email
4. Add it to Cloudflare Pages environment variables

**Note**: The access key is public (not secret) and required for the contact form to work.

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