# Production Launch Guide for phialo.de

## Executive Summary

This guide provides a complete roadmap for launching phialo.de to production on Cloudflare Workers. The infrastructure is fully configured in code, but requires specific secrets, API tokens, and Cloudflare configurations to be set up before deployment.

## Prerequisites

- Cloudflare account with phialo.de domain
- GitHub repository access with admin privileges
- Resend account for email services
- Access to create Cloudflare API tokens

## Critical Configuration Required

### 1. Zone ID Configuration (BLOCKER)

The most critical configuration that must be completed before any production deployment:

**File**: `workers/wrangler.toml` (line 28)
```toml
zone_id = "YOUR_ZONE_ID"  # MUST REPLACE WITH ACTUAL ZONE ID
```

**How to get your Zone ID:**
1. Log into Cloudflare Dashboard
2. Select the phialo.de domain
3. On the Overview page, find the Zone ID in the right sidebar
4. Copy the Zone ID
5. Replace `YOUR_ZONE_ID` in the wrangler.toml file

## Step-by-Step Launch Process

### Phase 1: Cloudflare Setup (Day 1)

#### 1.1 Create API Token
1. Navigate to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Select "Custom token"
4. Configure permissions:
   - **Account Resources**:
     - Workers Scripts: Edit
     - Workers KV Storage: Edit
   - **Zone Resources** (for phialo.de):
     - Workers Routes: Edit
     - Zone: Read
5. Save the token securely

#### 1.2 Configure Turnstile CAPTCHA
1. Go to Cloudflare Dashboard → Turnstile
2. Click "Add Widget"
3. Add these domains:
   - phialo.de
   - www.phialo.de
   - *.meise.workers.dev
4. Save the Site Key (public) and Secret Key (private)

### Phase 2: GitHub Configuration (Day 1-2)

#### 2.1 Repository Secrets
Add these secrets in Settings → Secrets and variables → Actions:

```yaml
# Required for all deployments
CLOUDFLARE_API_TOKEN: <your-api-token>
CLOUDFLARE_ACCOUNT_ID: <your-account-id>
PUBLIC_TURNSTILE_SITE_KEY: <turnstile-site-key>
```

#### 2.2 Environment Configuration

Create two environments in Settings → Environments:

**Production Environment:**
- Name: `production`
- URL: `https://phialo.de`
- Protection rules:
  - Required reviewers: 1
  - Deployment branches: `master` only
- Secrets:
  ```yaml
  RESEND_API_KEY: <production-resend-key>
  FROM_EMAIL: noreply@phialo.de
  TO_EMAIL: info@phialo.de
  TURNSTILE_SECRET_KEY: <production-turnstile-secret>
  ```

**Preview Environment:**
- Name: `preview`
- URL: `https://phialo-design-preview.meise.workers.dev`
- No protection rules
- Secrets:
  ```yaml
  RESEND_API_KEY: <test-resend-key>
  FROM_EMAIL: onboarding@resend.dev
  TO_EMAIL: <test-email@example.com>
  TURNSTILE_SECRET_KEY: <test-turnstile-secret>
  ```

### Phase 3: Email Service Setup (Day 2)

#### 3.1 Resend Configuration
1. Create account at https://resend.com
2. Add domain: phialo.de
3. Verify domain ownership (add DNS records)
4. Create sender: noreply@phialo.de
5. Generate API keys:
   - Development key (for testing)
   - Production key (for live site)

### Phase 4: Pre-Launch Testing (Day 3)

#### 4.1 Local Testing
```bash
cd phialo-design
npm run build
npm run test:run
npm run lint
npm run typecheck
npm run preview
```

#### 4.2 Preview Deployment
```bash
# Deploy to preview environment
cd workers
npm run deploy:preview

# Monitor logs
npm run tail:preview
```

#### 4.3 Verification Checklist
- [ ] Site loads without errors
- [ ] Both language versions work (German/English)
- [ ] Contact form submits successfully
- [ ] Email is received at test address
- [ ] Turnstile CAPTCHA appears
- [ ] All images load properly
- [ ] Mobile responsive design works

### Phase 5: Production Security (Day 4)

#### 5.1 Cloudflare Security Settings

Navigate to Cloudflare Dashboard for phialo.de:

1. **Security → WAF**
   - Enable WAF
   - Deploy Cloudflare Managed Ruleset
   - Deploy OWASP Core Ruleset

2. **Security → Rate Limiting**
   - Create rule for `/api/contact`
   - Limit: 10 requests per minute per IP

3. **Security → Bots**
   - Enable Bot Fight Mode

4. **SSL/TLS → Overview**
   - Set encryption mode to "Full (Strict)"

5. **DNS → Settings**
   - Enable DNSSEC

#### 5.2 Performance Optimization

1. **Speed → Optimization**
   - Enable Auto Minify (HTML, CSS, JS)
   - Enable Brotli compression
   - Enable Polish (Lossy)
   - Enable Mirage

2. **Caching → Configuration**
   - Set Browser Cache TTL: 4 hours
   - Enable Always Online

### Phase 6: Production Deployment (Day 5)

#### 6.1 Final Pre-Flight Checks
- [ ] Zone ID configured in wrangler.toml
- [ ] All secrets configured in GitHub
- [ ] Resend domain verified
- [ ] Turnstile configured
- [ ] Security settings enabled

#### 6.2 Deploy to Production

**Option A: GitHub Actions UI**
1. Go to Actions tab
2. Select "Manual Cloudflare Deployment"
3. Click "Run workflow"
4. Select:
   - Branch: `master`
   - Environment: `production`
5. Click "Run workflow"
6. Approve deployment when prompted

**Option B: Command Line**
```bash
cd phialo-design
npm run build

cd ../workers
npm run deploy:production

# Monitor deployment
npm run tail
```

### Phase 7: Post-Launch (Day 5-7)

#### 7.1 Monitoring Setup

1. **Health Checks**
   - Cloudflare → Traffic → Health Checks
   - Create check for https://phialo.de
   - Set notification method

2. **Worker Analytics**
   - Monitor in Cloudflare Dashboard
   - Set up alerts for:
     - 5xx errors > 1%
     - CPU time > 10ms average
     - Request rate anomalies

#### 7.2 Production Verification
- [ ] Access https://phialo.de
- [ ] Test HTTPS redirect
- [ ] Submit contact form
- [ ] Verify email delivery to info@phialo.de
- [ ] Check all portfolio items
- [ ] Test language switching
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Verify security headers

## Rollback Procedure

If issues occur after deployment:

### Immediate Rollback
```bash
# Get last known good deployment
git log --oneline -10

# Deploy specific commit
cd workers
npm run deploy:production -- --commit <commit-sha>
```

### Via GitHub Actions
1. Go to Actions → Manual Cloudflare Deployment
2. Run workflow with:
   - Branch: `master`
   - Commit SHA: `<last-good-commit>`
   - Environment: `production`

## Troubleshooting

### Common Issues

#### Zone ID Error
```
Error: Zone ID is not configured
```
**Solution**: Update `workers/wrangler.toml` with actual Zone ID

#### API Token Invalid
```
Error: Authentication error
```
**Solution**: Regenerate token with correct permissions

#### Email Not Sending
**Checks**:
1. Verify Resend domain is verified
2. Check FROM_EMAIL matches verified sender
3. Verify API key is correct for environment

#### Turnstile Not Working
**Note**: Pre-clearance only works on production domain (phialo.de), not on workers.dev subdomains. Console warnings on workers.dev are expected.

## Security Considerations

### API Keys Management
- Never commit secrets to repository
- Use separate keys for dev/prod
- Rotate keys quarterly
- Monitor key usage in provider dashboards

### Access Control
- Limit production deployment access
- Use GitHub environment protection
- Require PR reviews before merge
- Enable audit logging

## Maintenance Schedule

### Daily
- Monitor error rates
- Check email delivery
- Review security alerts

### Weekly
- Review analytics
- Check performance metrics
- Update dependencies (dev only)

### Monthly
- Security audit
- Performance optimization review
- Backup verification

## Emergency Contacts

- **Cloudflare Support**: https://dash.cloudflare.com/support
- **GitHub Support**: https://support.github.com
- **Resend Support**: support@resend.com

## Appendix: Environment Variables Reference

### Build-time Variables
```bash
PUBLIC_TURNSTILE_SITE_KEY  # Cloudflare Turnstile site key (public)
```

### Runtime Secrets (Workers)
```bash
RESEND_API_KEY             # Resend API key for email
FROM_EMAIL                 # Sender email address
TO_EMAIL                   # Recipient email address
TURNSTILE_SECRET_KEY       # Turnstile secret key (private)
```

### Deployment Variables
```bash
CLOUDFLARE_API_TOKEN       # API token for deployment
CLOUDFLARE_ACCOUNT_ID      # Cloudflare account ID
```

## Success Metrics

Production launch is successful when:
- ✅ Zero 5xx errors for 24 hours
- ✅ Page load time < 3 seconds
- ✅ Lighthouse score > 90
- ✅ Email delivery rate > 99%
- ✅ No security incidents
- ✅ Uptime > 99.9%

---

*Last Updated: January 2025*
*Version: 1.0.0*