# Configure Cloudflare Turnstile for Production

This guide explains how to configure Cloudflare Turnstile for production deployment on phialo.de.

## Prerequisites

- Access to the Cloudflare Dashboard
- GitHub repository admin access (for setting secrets)
- Production Turnstile site key and secret key

## Production Keys

For phialo.de production deployment:
- **Site Key (Public)**: `0x4AAAAAABqCQ4FwHKMUuQnB`
- **Secret Key**: Must be obtained from Cloudflare Dashboard (keep confidential!)

## Setup Steps

### 1. Configure GitHub Repository Secrets

Add the following secrets to your GitHub repository:

```bash
# Using GitHub CLI
gh secret set PUBLIC_TURNSTILE_SITE_KEY --body "0x4AAAAAABqCQ4FwHKMUuQnB"
gh secret set TURNSTILE_SECRET_KEY --body "your_actual_secret_key_here"
```

Or via GitHub UI:
1. Go to Settings → Secrets and variables → Actions
2. Add `PUBLIC_TURNSTILE_SITE_KEY` with value `0x4AAAAAABqCQ4FwHKMUuQnB`
3. Add `TURNSTILE_SECRET_KEY` with your secret key from Cloudflare

### 2. Configure Cloudflare Turnstile Widget

In the Cloudflare Dashboard:

1. Navigate to Turnstile → Your Site
2. Configure these domains:
   ```
   phialo.de
   www.phialo.de
   *.phialo.de
   localhost
   localhost:4321
   localhost:4322
   phialo-master.meise.workers.dev
   phialo-pr-*.meise.workers.dev
   ```

3. Enable these settings:
   - **Widget Mode**: Managed
   - **Pre-clearance**: Enabled
   - **Pre-clearance Level**: Managed
   - **Appearance**: Auto

### 3. Verify Environment Variables

The GitHub Actions workflows automatically inject these secrets during deployment:

- **Build time**: `PUBLIC_TURNSTILE_SITE_KEY` → Available as `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY`
- **Runtime**: `TURNSTILE_SECRET_KEY` → Available in Cloudflare Workers environment

### 4. Deploy to Production

```bash
# Deploy to production using GitHub Actions
gh workflow run manual-deploy.yml -f environment=production

# Or use the deploy script
./scripts/deploy.sh -e production
```

### 5. Test Production Deployment

After deployment, verify:

1. **Basic Protection**: Visit https://phialo.de and submit the contact form
2. **Pre-clearance**: Submit multiple forms without re-verification
3. **Console**: Check for any Turnstile errors (none should appear on production)
4. **Analytics**: Monitor Cloudflare Dashboard for validation metrics

## Environment-Specific Behavior

| Environment | Site Key | Secret Key | Pre-clearance |
|-------------|----------|------------|---------------|
| Development (localhost) | Test key | Test key | ✅ Works |
| Preview (*.workers.dev) | Production | Production | ❌ Not supported* |
| Production (phialo.de) | Production | Production | ✅ Full support |

*Console warning expected on workers.dev domains - this is normal behavior.

## Troubleshooting

### Common Issues

1. **Error 110200**: Domain not configured in Turnstile widget
   - Solution: Add missing domain to widget configuration

2. **Token validation fails**: Secret key mismatch
   - Solution: Verify `TURNSTILE_SECRET_KEY` is correctly set

3. **Pre-clearance not working**: Only works on Cloudflare zones
   - Solution: Test on production domain (phialo.de), not preview URLs

4. **Widget not appearing**: CSP blocking scripts
   - Solution: Ensure CSP allows `challenges.cloudflare.com`

### Verification Commands

```bash
# Check if secrets are set (won't show values)
gh secret list

# Test build with production keys locally (requires secrets)
PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAABqCQ4FwHKMUuQnB" pnpm run build

# Deploy and monitor logs
pnpm run deploy:production
npx wrangler tail phialo-design
```

## Security Best Practices

1. **Never commit keys**: Keep them in GitHub Secrets only
2. **Rotate keys regularly**: Update both site and secret keys periodically
3. **Monitor usage**: Check Cloudflare Analytics for suspicious patterns
4. **Single-use tokens**: Each token can only be validated once
5. **Server-side validation**: Always validate tokens on the backend

## References

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Phialo Turnstile Setup Guide](./setup-turnstile-preclearance.md)